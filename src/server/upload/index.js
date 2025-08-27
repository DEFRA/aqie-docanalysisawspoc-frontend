import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream'
import util from 'util'
import { parsePdfToJson, pdfParse } from '../utils/pdfParser.js'
import { createLogger } from '../../server/common/helpers/logging/logger.js'
import { config } from '../../config/config.js'
import axios from 'axios'
import { PassThrough } from 'stream'
import { greenPrompt, redPrompt } from '../common/constants/prompts.js'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

const logger = createLogger()
const pump = util.promisify(pipeline)

// Helper function to convert stream to buffer
const streamToBuffer = async (stream) => {
  const chunks = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
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
            return h.view('upload/index', {
              isAuthenticated: true,
              user: user,
              status: null,
              model: model
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
              maxBytes: 50 * 1024 * 1024,
              allow: 'multipart/form-data',
              timeout: 5 * 60 * 1000
            },
            timeout: {
              server: 5 * 60 * 1000,
              socket: 6 * 60 * 1000
            }
          },
          handler: async (request, h) => {
            const { payload } = request
            const model = request.query.model || 'model1'
            const analysisType = payload?.analysisType || 'green'
            let s3Key=''
            let s3Bucket=''
              // Sequential service-based upload
              const file = payload?.policyPdf
              if (!file || file.hapi.headers['content-type'] !== 'application/pdf') {
                return h.view('upload/index', {
                  isAuthenticated: true,
                  user: request.auth.credentials.user,
                  status: 'error',
                  message: 'Please upload a PDF file.',
                  model: model,
                  analysisType: analysisType
                })
              }
              
              // Step 1: Invoke cdpUploaderUrl/initiate
              const cdpUploaderUrl = config.get('cdpUploaderUrl')
              const bucket = config.get('aws.s3BucketName')
              
              const initiateResponse = await axios.post(
                `${cdpUploaderUrl}/initiate`,
                { redirect: '/', s3Bucket: bucket },
                { headers: { 'Content-Type': 'application/json' } }
              )
              
              const uploadUrl = initiateResponse.data.uploadurl
              
              // Upload file to CDP service
              const formData = new FormData()
              formData.append('file', file)
              
              await fetch(uploadUrl, {
                method: 'POST',
                body: formData
              })
              
              // Step 3: Poll uploadUrl every 2 seconds until status is ready
              let uploadStatus = 'pending'
              
              while (uploadStatus !== 'ready') {
                await new Promise(resolve => setTimeout(resolve, 2000))
                
                const statusResponse = await fetch(uploadUrl, {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' }
                })
                
                const status = await statusResponse.json()
                uploadStatus = status.uploadStatus
                
                if (uploadStatus === 'ready') {
                  s3Key = status.s3key
                  s3Bucket = status.s3bucket
                  break
                }
              }
            
            try {
              // Step 4: Read from S3 using s3Key and s3Bucket
              const s3Client = new S3Client({ region: config.get('aws.region') })
              const getObjectCommand = new GetObjectCommand({
                Bucket: s3Bucket,
                Key: s3Key
              })
              
              const s3Response = await s3Client.send(getObjectCommand)
              const pdfBuffer = await streamToBuffer(s3Response.Body)
              
              // Step 5: Pass stream to parsePdfToJson function
              const pdfText = await pdfParse(pdfBuffer)
              const pdfTextContent = pdfText.map(page => page.content).join('\n\n')
              
              // Step 6: Call backend API (existing functionality)
              const backendApiUrl = config.get('backendApiUrl')
              const requestPrompt = {
                systemprompt: analysisType === 'green' ? greenPrompt : redPrompt,
                userprompt: pdfTextContent
              }
              
              const response = await axios.post(
                `${backendApiUrl}/summarize`,
                {
                  systemprompt: requestPrompt.systemprompt,
                  userprompt: requestPrompt.userprompt,
                  modelid: model
                },
                { headers: { 'Content-Type': 'text/plain' } }
              )
              
              const requestId = response.data.requestId
              return h.redirect(`/status/${requestId}`)
              
            } catch (error) {
              logger.error(`Service upload error: ${error.message}`)
              return h.view('upload/index', {
                isAuthenticated: true,
                user: request.auth.credentials.user,
                status: 'error',
                message: 'Error processing upload: ' + error.message,
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
              const prompt = analysisType === 'green' ? greenPrompt : redPrompt

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
        }
      ])
    }
  }
}