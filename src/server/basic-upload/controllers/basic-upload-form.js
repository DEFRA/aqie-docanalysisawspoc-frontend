import { config } from '../../../config/config.js'
import { createLogger } from '../../common/helpers/logging/logger.js'

const logger = createLogger()
const basicUploadFormController = {
  options: {},
  handler: async (request, h) => {
    // Clear any session data.
    request.yar.clear('basic-upload')

    // First, initiate the upload by calling the CDP-Uploader's initiate API.
    // Use the real uploader URL for server-to-server calls
    const endpointUrl = config.get('cdpUploaderUrl') + '/initiate'

    // Use a relative path for redirect as required by the CDP Uploader API
    const redirectUrl = '/basic/complete'
    logger.info(
      'CDP Uploader initiate payload:',
      JSON.stringify({
        redirect: redirectUrl,
        s3Bucket: config.get('aws.s3BucketName')
      })
    )

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        redirect: redirectUrl,
        s3Bucket: config.get('aws.s3BucketName')
      })
    })

    const contentType = response.headers.get('content-type') || ''
    if (!response.ok || !contentType.includes('application/json')) {
      const text = await response.text()
      logger.error(`Uploader responded with status ${response.status}: ${text}`)
      throw new Error(`Uploader error: ${response.status}`)
    }

    const upload = await response.json()
    logger.info('Initiate response from cdp-uploader:', JSON.stringify(upload))
    logger.info('Upload URL:', upload.uploadUrl)
    logger.info('Status URL:', upload.statusUrl)
    // Use the reverse proxy for uploadUrl and statusUrl
    const absoluteuploadUrl = '/uploader' + upload.uploadUrl
    // The payload from initiate contains two urls:
    // uploadUrl - we will use this URL in the form we're about to render. The content of this form will be sent to
    //          the CDP Uploader first, not our service.
    // statusUrl - we can poll this endpoint to find out the status of the URL. We can either remember it in the session
    //             or use the statusId query param from the redirect.

    // Optional: remember the status URL in the session for later
    // Store the proxied statusUrl in the session for later
    request.yar.set('basic-upload', {
      statusUrl: '/uploader' + upload.statusUrl
    })
    logger.info('Upload URL:', absoluteuploadUrl)
    logger.info('Status URL:', upload.statusUrl)

    // Next, render the form passing in the uploadUrl. This is just a simple HTML form that makes a multipart/form-data request
    return h.view('basic-upload/views/basic-upload-form', {
      pageTitle: 'Basic CDP-Uploader example',
      action: absoluteuploadUrl,
      heading: 'Basic upload example'
    })
  }
}

export { basicUploadFormController }
