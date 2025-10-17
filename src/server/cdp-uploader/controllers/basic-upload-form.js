import { config } from '../../../config/config.js'
import { createLogger } from '../../common/helpers/logging/logger.js'
import { initUpload } from '../helper/init-upload.js'

const logger = createLogger()
const basicUploadFormController = {
  options: { auth: { strategy: 'login', mode: 'required' } },

  handler: async (request, h) => {
    const { payload } = request
    const isGetRequest = request.method.toLowerCase() === 'get'
    
    if (isGetRequest) {
      logger.info('DEBUG: GET request - displaying form')
    } else {
      logger.info('DEBUG: POST request - processing form submission')
      logger.info(`DEBUG: Full payload received: ${JSON.stringify(payload)}`)
    }
    
    // Clear any session data.
    request.yar.clear('basic-upload')
    logger.info('DEBUG: Cleared basic-upload session data')
    
    const isCompare = payload?.isCompare === 'true'
    const redirect = '/Uploader/complete'
    logger.info(`DEBUG: Processing upload request - isCompare: ${isCompare}`)
    if (!isGetRequest) {
      logger.info(`DEBUG: isCompare flag: ${isCompare} (from payload.isCompare: ${payload?.isCompare})`)
    }
    let s3Bucket
    try {
      s3Bucket = config.get('aws.s3BucketName')
      if (!s3Bucket) {
        throw new Error('S3 bucket name not configured')
      }
    } catch (error) {
      logger.error('Failed to get S3 bucket configuration:', error)
      return h.response({ error: 'Configuration error' }).code(500)
    }

    let secureUpload
    try {
      secureUpload = await initUpload({
        redirect,
        s3Bucket
      })
    } catch (error) {
      logger.error('Failed to initialize upload:', error)
      return h.response({ error: 'Upload initialization failed' }).code(500)
    }
    logger.info(`Secure upload response: ${JSON.stringify(secureUpload)}`)
    // The payload from initiate contains two urls:
    // uploadUrl - we will use this URL in the form we're about to render. The content of this form will be sent to
    //          the CDP Uploader first, not our service.
    // statusUrl - we can poll this endpoint to find out the status of the URL. We can either remember it in the session
    //             or use the statusId query param from the redirect.

    // Optional: remember the status URL in the session for later
    // Only write to the session for authenticated users to avoid creating session cookies for anonymous guests
    if (request.auth && request.auth.isAuthenticated) {
      request.yar.set('basic-upload', { statusUrl: secureUpload.statusUrl })
      request.yar.set('model', { model: request.query.model || 'model1' })
      request.yar.set('analysisType', {
        analysisType: payload?.analysisType || ''
      })
    }
    
    logger.info(`DEBUG: Set analysisType in session: ${payload?.analysisType || ''}`)
    
    // Store comparison data in session if this is a compare operation
    if (isCompare) {
      const concatenatedFilename = payload?.concatenatedFilename
      
      logger.info(`DEBUG: Form received compare data:`)
      logger.info(`DEBUG: isCompare = ${isCompare}`)
      logger.info(`DEBUG: concatenatedFilename = '${concatenatedFilename}'`)
      logger.info(`DEBUG: compareS3Bucket = ${payload?.compareS3Bucket}`)
      logger.info(`DEBUG: compareS3Key = ${payload?.compareS3Key}`)
      logger.info(`DEBUG: compareUploadId = ${payload?.compareUploadId}`)
      
      if (!concatenatedFilename || concatenatedFilename.trim() === '') {
        logger.error('DEBUG: concatenatedFilename is missing or empty from payload!')
        logger.error('DEBUG: This will prevent proper filename display')
      }
      
      const compareData = {
        s3Bucket: payload?.compareS3Bucket,
        s3Key: payload?.compareS3Key,
        uploadId: payload?.compareUploadId,
        concatenatedFilename: concatenatedFilename?.trim() || 'Unknown vs Unknown',
        isCompare: true
      }
      
      if (request.auth && request.auth.isAuthenticated) {
        request.yar.set('compareData', compareData)
      }
      logger.info(`DEBUG: Stored compareData in session: ${JSON.stringify(compareData)}`)
    }
    logger.info(`Model: ${request.query.model || 'model1'}`)
    logger.info(`Analysis Type: ${payload?.analysisType || 'green'}`)
    logger.info(`Upload URL: ${secureUpload.uploadUrl}`)
    logger.info(`Status URL: ${secureUpload.statusUrl}`)
    
    if (!isGetRequest) {
      logger.info(`DEBUG: Full payload received: ${JSON.stringify(payload)}`)
    }

    // Get user's uploads for display
    const user = request.auth.credentials.user
    const userId = user?.id || user?.email || 'anonymous'
    
    // Load upload queue to get user uploads
    const fs = await import('fs')
    const path = await import('path')
    const queueFile = path.join(process.cwd(), 'upload-queue.json')
    let userUploads = []
    
    try {
      if (fs.existsSync(queueFile)) {
        const data = fs.readFileSync(queueFile, 'utf8')
        const parsed = JSON.parse(data)
        if (Array.isArray(parsed)) {
          const uploadMap = new Map(parsed)
          userUploads = Array.from(uploadMap.values())
            .filter((upload) => upload.userId === userId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        }
      }
    } catch (error) {
      logger.error('Error loading uploads:', error)
    }

    // Next, render the form passing in the uploadUrl. This is just a simple HTML form that makes a multipart/form-data request
    return h.view('cdp-uploader/views/basic-upload-form', {
      isAuthenticated: true,
      user: request.auth.credentials.user,
      action: secureUpload.uploadUrl,
      analysisType: payload?.analysisType || '',
      model: request.query.model || 'model1',
      uploads: userUploads
    })
  }
}
export { basicUploadFormController }
