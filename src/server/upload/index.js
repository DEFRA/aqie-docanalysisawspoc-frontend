import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream'
import util from 'util'
import { parsePdfToJson } from '../utils/pdfParser.js'
import { createLogger } from '../../server/common/helpers/logging/logger.js'
import { config } from '../../config/config.js'
import axios from 'axios'
import { PassThrough } from 'stream'
import {
  greenPrompt,
  redPrompt,
  redInvestmentCommitteeBriefing,
  executiveBriefing
} from '../common/constants/prompts.js'

const logger = createLogger()
const pump = util.promisify(pipeline)

// Persistent upload queue using file storage
const queueFile = path.join(process.cwd(), 'upload-queue.json')

function loadQueue() {
  try {
    if (fs.existsSync(queueFile)) {
      const data = fs.readFileSync(queueFile, 'utf8')
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        return new Map(parsed)
      }
    }
  } catch (error) {
    console.error('Error loading queue:', error)
  }
  return new Map()
}

function saveQueue() {
  try {
    fs.writeFileSync(queueFile, JSON.stringify([...uploadQueue]))
  } catch (error) {
    console.error('Error saving queue:', error)
  }
}

const uploadQueue = loadQueue()

function startSNSPolling(uploadId, requestId) {
  const pollInterval = setInterval(async () => {
    try {
      const backendApiUrl = config.get('backendApiUrl')
      const response = await axios.get(`${backendApiUrl}/getS3/${requestId}`)

      const upload = uploadQueue.get(uploadId)
      if (!upload) {
        clearInterval(pollInterval)
        return
      }

      if (
        response.data &&
        response.data.getS3result &&
        response.data.getS3result.status === 'completed'
      ) {
        upload.status = 'completed'
        uploadQueue.set(uploadId, upload)
        saveQueue()
        clearInterval(pollInterval)
        logger.info(`SNS: Upload ${uploadId} completed successfully`)
      }
    } catch (error) {
      logger.info(`Polling error for ${uploadId}: ${error.message}`)
    }
  }, 10000)

  setTimeout(() => {
    clearInterval(pollInterval)
    const upload = uploadQueue.get(uploadId)
    if (upload && upload.status === 'analysing') {
      upload.status = 'failed'
      upload.error = 'Analysis timeout'
      uploadQueue.set(uploadId, upload)
      saveQueue()
    }
  }, 600000)
}

export const upload = {
  plugin: {
    name: 'upload',
    register: async (server) => {
      server.route([
        {
          method: 'GET',
          path: '/upload',
          options: { auth: { strategy: 'login', mode: 'required' } },
          handler: (request, h) => {
            const user = request.auth.credentials.user
            const model = request.query.model || 'model1'

            // Get user's uploads
            const userId = user?.id || user?.email || 'anonymous'
            const userUploads = Array.from(uploadQueue.values())
              .filter((upload) => upload.userId === userId)
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

            return h.view('upload/index', {
              isAuthenticated: true,
              user: user,
              status: null,
              model: model,
              uploads: userUploads
            })
          }
        },
        {
          method: 'POST',
          path: '/upload',
          options: {
            auth: { strategy: 'login', mode: 'required' },
            payload: {
              output: 'stream',
              parse: true,
              multipart: true,
              maxBytes: 50 * 1024 * 1024, // 50MB limit
              allow: 'multipart/form-data',
              timeout: 5 * 60 * 1000
            },
            timeout: {
              server: 5 * 60 * 1000,
              socket: 6 * 60 * 1000
            }
          },
          handler: async (request, h) => {
            const startTime = Date.now() // Start timer
            const { payload } = request
            const model = request.query.model || 'model1'
            const analysisType = payload?.analysisType || 'green'
            const file = payload?.policyPdf
            logger.info(analysisType)
            if (
              !file ||
              file.hapi.headers['content-type'] !== 'application/pdf'
            ) {
              return h.view('upload/index', {
                isAuthenticated: true,
                user: request.auth.credentials.user,
                status: 'error',
                message: 'Please upload a PDF file.',
                model: model,
                analysisType: payload?.analysisType || 'green'
              })
            }
            const uploadDir = path.join(process.cwd(), 'uploads')
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)
            const filename = `${Date.now()}-${file.hapi.filename}`
            const filepath = path.join(uploadDir, filename)
            const uploadStart = Date.now()
            await pump(file, fs.createWriteStream(filepath))

            const uploadEnd = Date.now()
            logger.info(
              `File upload time: ${(uploadEnd - uploadStart) / 1000} seconds`
            )

            try {
              const parseStart = Date.now()

              //let newFilePath = path.join(process.cwd(), 'src', 'server', 'assets', 'ProtectedSitesStrategies-17.03.2025.pdf');

              logger.info(`Using PDF file: ${filepath}`)

              const pdfText = await parsePdfToJson(filepath)
              await fs.unlinkSync(filepath)

              const parseEnd = Date.now()
              logger.info(
                `PDF parsing time: ${(parseEnd - parseStart) / 1000} seconds`
              )

              // Convert PDF text to a string for the API call
              //value of pdf file
              const pdfTextContent = pdfText
                .map((page) => page.content)
                .join('\n\n')

              logger.info(
                `Size of PDF text content: ${pdfTextContent.length} characters`
              )
              const encoder = new TextEncoder()
              const byteSize = encoder.encode(pdfTextContent).length

              const sizeInKB = (byteSize / 1024).toFixed(2)

              logger.info(`Size of PDF text content:- ${byteSize} bytes`)
              logger.info(`Size of PDF text content:- ${sizeInKB} KB`)

              try {
                const backendApiUrl = config.get('backendApiUrl')

                let selectedPrompt
                switch (analysisType) {
                  case 'green':
                    selectedPrompt = greenPrompt
                    break
                  case 'investment':
                    selectedPrompt = redInvestmentCommitteeBriefing
                    break
                  case 'executive':
                    selectedPrompt = executiveBriefing
                    break
                  default:
                    selectedPrompt = redPrompt
                }

                const requestPrompt = {
                  systemprompt: selectedPrompt,
                  userprompt: pdfTextContent
                }

                const backendServiceStart = Date.now()

                const response = await axios.post(
                  `${backendApiUrl}/summarize`,
                  {
                    systemprompt: requestPrompt.systemprompt,
                    userprompt: requestPrompt.userprompt,
                    modelid: model
                  },
                  {
                    headers: {
                      'Content-Type': 'text/plain'
                    }
                  }
                )

                const backendServiceEnd = Date.now()
                logger.info(
                  `Backend Call time taken to receive response: ${(backendServiceEnd - backendServiceStart) / 1000} seconds`
                )

                const totalTime = (backendServiceEnd - startTime) / 1000
                logger.info(`Total processing time: ${totalTime} seconds`)

                const requestId = response.data.requestId
                logger.info(`Request ID: ${requestId}`)

                // Add to upload queue instead of redirecting
                const user = request.auth.credentials.user
                const uploadRequest = {
                  id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  userId: user?.id || user?.email || 'anonymous',
                  filename: file.hapi.filename,
                  analysisType: analysisType,
                  model: model,
                  status: 'analysing',
                  timestamp: new Date().toISOString(),
                  requestId: requestId
                }

                // Store in persistent queue
                uploadQueue.set(uploadRequest.id, uploadRequest)
                saveQueue()

                // Start SNS-like background polling
                startSNSPolling(uploadRequest.id, requestId)

                // Get updated uploads list including the new one
                const userId = user?.id || user?.email || 'anonymous'
                const userUploads = Array.from(uploadQueue.values())
                  .filter((upload) => upload.userId === userId)
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

                return h.view('upload/index', {
                  isAuthenticated: true,
                  user: user,
                  status: 'success',
                  message: 'File uploaded successfully. Analysis in progress.',
                  model: model,
                  analysisType: analysisType,
                  requestId: requestId,
                  uploads: userUploads
                })
              } catch (apiError) {
                logger.error(`Backend API error: ${apiError.message}`)
                if (apiError.status) {
                  logger.error(`Status: ${apiError.status}`)
                }
                if (apiError.error) {
                  logger.error(
                    `Error details: ${JSON.stringify(apiError.error)}`
                  )
                }

                // Return the view with just the markdown content
                return h.view('upload/index', {
                  isAuthenticated: true,
                  user: request.auth.credentials.user,
                  status: 'success',
                  markdownContent:
                    'Unable to generate summary. Using raw document content instead.',
                  filename: file.hapi.filename,
                  model: model,
                  analysisType: analysisType
                })
              }
            } catch (error) {
              logger.error(`Error while parsing PDF: ${error}`)
              logger.error(
                `JSON Error while parsing PDF: ${JSON.stringify(error)}`
              )
              return h.view('upload/index', {
                isAuthenticated: true,
                user: request.auth.credentials.user,
                status: 'error',
                message: 'Error processing PDF: ' + error.message,
                model: model,
                analysisType: analysisType
              })
            }
          }
        },
        {
          method: 'GET',
          path: '/stream-summary',
          options: {
            auth: { strategy: 'login', mode: 'required' },
            handler: async (request, h) => {
              const { model, analysisType, filename } = request.query
              const uploadDir = path.join(process.cwd(), 'uploads')
              const tempStorePath = path.join(uploadDir, `${filename}.txt`)

              if (!fs.existsSync(tempStorePath)) {
                return h.response('Missing parsed content').code(404)
              }

              const pdfTextContent = fs.readFileSync(tempStorePath, 'utf-8')
              let prompt
              switch (analysisType) {
                case 'green':
                  prompt = greenPrompt
                  break
                case 'investment':
                  prompt = redInvestmentCommitteeBriefing
                  break
                case 'executive':
                  prompt = executiveBriefing
                  break
                default:
                  prompt = redPrompt
              }

              const response = h.response()
              response.code(200)
              response.type('text/event-stream')
              response.header('Cache-Control', 'no-cache')
              response.header('Connection', 'keep-alive')

              const stream = new PassThrough()
              response.source = stream

              // Send initial message
              stream.write(`data: Starting analysis...\n\n`)

              try {
                const backendApiUrl = config.get('backendApiUrl')

                let prompt
                switch (analysisType) {
                  case 'green':
                    prompt = greenPrompt
                    break
                  case 'investment':
                    prompt = redInvestmentCommitteeBriefing
                    break
                  case 'executive':
                    prompt = executiveBriefing
                    break
                  default:
                    prompt = redPrompt
                }

                const axiosResponse = await axios({
                  method: 'post',
                  url: `${backendApiUrl}/stream-summarize`,
                  data: {
                    systemprompt: prompt,
                    userprompt: pdfTextContent,
                    modelid: model
                  },
                  responseType: 'stream'
                })

                axiosResponse.data.on('data', (chunk) => {
                  const text = chunk.toString().trim()
                  if (text) {
                    stream.write(`data: ${text}\n\n`)
                  }
                })

                axiosResponse.data.on('end', () => {
                  stream.write(`event: end\ndata: done\n\n`)
                  stream.end()
                })

                axiosResponse.data.on('error', (err) => {
                  stream.write(`data: Error: ${err.message}\n\n`)
                  stream.end()
                })
              } catch (err) {
                stream.write(
                  `data: Error contacting backend: ${err.message}\n\n`
                )
                stream.end()
              }

              return response
            }
          }
        },
        {
          method: 'GET',
          path: '/upload/status',
          options: { auth: { strategy: 'login', mode: 'required' } },
          handler: (request, h) => {
            const user = request.auth.credentials.user
            const userId = user?.id || user?.email || 'anonymous'
            const userUploads = Array.from(uploadQueue.values())
              .filter((upload) => upload.userId === userId)
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

            return h.response(userUploads)
          }
        }
      ])
    }
  }
}
