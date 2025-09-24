import { s3Client } from '../../common/helpers/s3-client.js'
import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { createLogger } from '../../common/helpers/logging/logger.js'
import fs from 'fs'
import path from 'path'
// import { pipeline } from 'stream'
// import util from 'util'
import { parsePdfToJson } from '../../utils/pdfParser.js'
import { config } from '../../../config/config.js'
import axios from 'axios'
import {
  greenPrompt,
  redPrompt,
  redInvestmentCommitteeBriefing,
  executiveBriefing
} from '../../common/constants/prompts.js'

const logger = createLogger()
// const pump = util.promisify(pipeline)

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
const baseUploadCompleteController = {
  options: {},
  handler: async (request, h) => {
    // The user is redirected to this page after their upload has completed, but possibly before scanning has finished.
    // Virus scanning takes about 1-2 seconds on small files up to about 10 seconds on large (100 meg) files.

    // To find out if the file is ready we need to call the cdp-uploader /status api with the upload id.
    //
    // There are two ways of doing this:
    // Option 1. Get the statusUrl from the session (we saved this in basic-upload-form.js)
    // Option 2. If you don't have a session cache etc generate it using the query param
    //           `const statusUrl = `${config.get('cdpUploaderUrl')}/status/${request.query.uploadId}`

    const { statusUrl } = request.yar.get('basic-upload')
    const { model } = request.yar.get('model')
    const { analysisType } = request.yar.get('analysisType')
    logger.info(
      `'Status URL from session its from complete comtroller:',
      ${statusUrl}`
    )
    logger.info(`Model inside the complete controller: ${model}`)
    logger.info(`Analysis Type inside the complete controller: ${analysisType}`)
    // You'll likely want to handle the statusUrl not being set more gracefully than this!

    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    const status = await response.json()
    logger.info(
      `'Status response from cdp-uploader:', ${JSON.stringify(status)}`
    )
    // 1. Check uploadStatus. UploadStatus can either be 'pending' (i.e. file is still being scanned) or 'ready'
    if (status.uploadStatus !== 'ready') {
      // If its not ready show the holding page. The holding page shows a please wait message and auto-reloads
      // after x seconds, causing this whole controller to run again, checking the status.

      const maxAttempts = 10 // Max number of polling attempts
      const delayMs = 2000 // Delay between attempts in milliseconds

      let status
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const response = await fetch(statusUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          })

          status = await response.json()
          logger.info(`Attempt ${attempt + 1}: ${JSON.stringify(status)}`)

          if (status.uploadStatus === 'ready') {
            const startTime = Date.now()
            const s3Key = status.form.policyPdf.s3Key
            const s3Bucket = status.form.policyPdf.s3Bucket
            // Step 1: Get PDF file from S3
            const getObjectResponse = await s3Client.send(
              new GetObjectCommand({
                Bucket: s3Bucket,
                Key: s3Key
              })
            )
            logger.info(
              `S3 Object retrieved: ${s3Key} from bucket: ${s3Bucket}`
            )
            const headerresponse = await s3Client.send(
              new HeadObjectCommand({
                Bucket: s3Bucket,
                Key: s3Key
              })
            )
            logger.info(
              'Custom ContentType:',
              headerresponse.Metadata['contenttype']
            )
            logger.info(
              'Encoded Filename:',
              headerresponse.Metadata['encodedfilename']
            )
            // Step 2: Convert stream to buffer
            const streamToBuffer = async (stream) => {
              const chunks = []
              for await (const chunk of stream) {
                chunks.push(chunk)
              }
              return Buffer.concat(chunks)
            }
            const buffer = await streamToBuffer(getObjectResponse.Body)
            logger.info(`File size from S3: ${buffer.length} bytes`)
            // Check if file is empty
            if (buffer.length === 0) {
              logger.warn(`File is empty: ${s3Key} from bucket: ${s3Bucket}`)
              return h.response({ error: 'File is empty' }).code(400)
            }
            // Step 3: Save buffer to a temporary file
            // const uploadDir = path.join(process.cwd(), 'uploads')
            // if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)
            // const filename = `${Date.now()}-${file.hapi.filename}`
            // const filepath = path.join(uploadDir, filename)
            // const uploadStart = Date.now()
            // await pump(buffer, fs.createWriteStream(filepath))
            // const uploadEnd = Date.now()
            // logger.info(
            //   `File upload time: ${(uploadEnd - uploadStart) / 1000} seconds`
            // )
            // logger.info(`File saved to: ${filepath}`)
            // Step 3: Save buffer to a temporary file
            const uploadDir = path.join(process.cwd(), 'uploads')
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)
            // const filename = `${Date.now()}-${path.basename(s3Key)}`
            const filename = `${Date.now()}-${headerresponse.Metadata['encodedfilename']}`
            logger.info(
              `Original Filename from S3 Key: ${path.basename(s3Key)}`
            )
            const encodedFilename = `${Date.now()}-${headerresponse.Metadata['encodedfilename']}`
            logger.info(`Encoded Filename from Metadata: ${encodedFilename}`)
            const filepath = path.join(uploadDir, filename)
            const uploadStart = Date.now()
            await fs.promises.writeFile(filepath, buffer)
            const uploadEnd = Date.now()
            logger.info(
              `File upload time: ${(uploadEnd - uploadStart) / 1000} seconds`
            )
            logger.info(`File saved to: ${filepath}`)
            // Step 4: Parse PDF to JSON
            const parseStart = Date.now()
            const pdfText = await parsePdfToJson(filepath)
            // await fs.unlinkSync(filepath)
            fs.unlinkSync(filepath)
            const parseEnd = Date.now()
            logger.info(
              `PDF parsing time: ${(parseEnd - parseStart) / 1000} seconds`
            )
            // logger.info(`Parsed PDF content: ${JSON.stringify(pdfText)}`)
            logger.info(`Parsed PDF content: ${pdfText.length}`)
            if (!pdfText || pdfText.length === 0) {
              logger.warn(`No text extracted from PDF: ${s3Key}`)
              return h
                .response({ error: 'No text extracted from PDF' })
                .code(400)
            }
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
                filename: headerresponse.Metadata['encodedfilename'],
                analysisType,
                model,
                status: 'analysing',
                timestamp: new Date().toISOString(),
                requestId
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
              logger.info(`User uploads: ${JSON.stringify(userUploads)}`)
              return h.view('cdp-uploader/views/basic-upload-form', {
                isAuthenticated: true,
                user,
                status: 'success',
                message: 'File uploaded successfully. Analysis in progress.',
                model,
                analysisType,
                requestId,
                uploads: userUploads
              })
            } catch (apiError) {
              logger.error(`Backend API error: ${apiError.message}`)
              if (apiError.status) {
                logger.error(`Status: ${apiError.status}`)
              }
              if (apiError.error) {
                logger.error(`Error details: ${JSON.stringify(apiError.error)}`)
              }

              // Return the view with just the markdown content
              return h.view('cdp-uploader/views/basic-upload-form', {
                isAuthenticated: true,
                user: request.auth.credentials.user,
                status: 'success',
                markdownContent:
                  'Unable to generate summary. Using raw document content instead.',
                filename: headerresponse.Metadata['encodedfilename'],
                model,
                analysisType
              })
            }
          }
        } catch (error) {
          logger.error(`Error while parsing PDF: ${error}`)
          logger.error(`JSON Error while parsing PDF: ${JSON.stringify(error)}`)
          return h.view('cdp-uploader/views/basic-upload-form', {
            isAuthenticated: true,
            user: request.auth.credentials.user,
            status: 'error',
            message: 'Error processing PDF: ' + error.message,
            model,
            analysisType
          })
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    // 2. Handle the file not being selected (optional).
    //
    // The 'form' field of the status is basically the content of the multipart/form-data form.
    // We can handle it just like handling a normal POST request. If no file is selected the policyPdf field of the form
    // will be missing.
    if (!status.form.policyPdf) {
      request.yar.flash('basic-upload', {
        formErrors: { policyPdf: { message: 'Select a file' } }
      })
      return h.redirect('/Uploader')
    }

    // 3. Check if the uploader had any errors (viruses, zero size file, failed to uploaded etc)
    //
    // If the uploaded file has an error, the policyPdf field will have a 'hasError' field set to 'true' and
    // an 'errorMessage' field populated with the failure reason.
    if (status.form.policyPdf?.hasError === true) {
      // The errorMessage field uses the GDS standard file upload error messages so can be presented directly to users.
      // see: https://design-system.service.gov.uk/components/file-upload/
      request.yar.flash('basic-upload', {
        formErrors: {
          policyPdf: { message: status.form.policyPdf.errorMessage }
        }
      })
      return h.redirect('/Uploader')
    }

    // 4. Handle the clean file
    // Unlike an actual multipart/form-data form, instead of the actual file data you get an S3 bucket & key reference
    // to where your file can be accessed. From here it is up to you what do you do with this information!

    // const s3Key = status.form.basicfile.s3Key
    // const s3Bucket = status.form.basicfile.s3Bucket

    // For demo purposes and to prove we've actually received the file, we'll get the S3 object's metadata.
    // In your app you likely want to do something different with the file!
    // const metadata = await s3Client.send(
    //   new HeadObjectCommand({
    //     Bucket: s3Bucket,
    //     Key: s3Key
    //   })
    // )
    // return h.view('basic-upload/views/basic-upload-complete', {
    //   heading: 'Basic upload example',
    //   metadata: JSON.stringify(metadata, null, 2)
    // })
  }
}

const cdpUploaderCompleteController = {
  options: {},
  handler: async (request, h) => {
    logger.info('Status API called to get user uploads')
    const user = request.auth.credentials.user
    const userId = user?.id || user?.email || 'anonymous'
    logger.info(`Fetching uploads for user: ${userId}`)

    // Get all uploads for this user
    const userUploads = Array.from(uploadQueue.values())
      .filter((upload) => upload.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    logger.info(`User uploads: ${JSON.stringify(userUploads)}`)
    return h.response(userUploads)
  }
}

const cdpUploaderBackController = {
          options: { auth: { strategy: 'login', mode: 'required' } },
          handler: (request, h) => {
            const user = request.auth.credentials.user
            const model = request.query.model || 'model1'

            // Get user's uploads
            const userId = user?.id || user?.email || 'anonymous'
            const userUploads = Array.from(uploadQueue.values())
              .filter((upload) => upload.userId === userId)
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

            return h.view('cdp-uploader/views/basic-upload-form', {
              isAuthenticated: true,
              user,
              status: null,
              model,
              uploads: userUploads
            })
          }
}

export { baseUploadCompleteController, cdpUploaderCompleteController, cdpUploaderBackController }
