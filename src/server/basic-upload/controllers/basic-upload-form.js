import { config } from '../../../config/config.js'
import { createLogger } from '../../common/helpers/logging/logger.js'

const logger = createLogger()
const basicUploadFormController = {
  options: {},
  handler: async (request, h) => {
    // Clear any session data.
    request.yar.clear('basic-upload')

    // First, initiate the upload by calling the CDP-Uploader's initiate API.
    const endpointUrl = config.get('cdpUploaderUrl') + '/initiate'

    // Improved protocol detection: prefer server.info.protocol, then X-Forwarded-Proto, then fallback
    let protocol = request.server.info.protocol
    if (!protocol && request.headers['x-forwarded-proto']) {
      protocol = request.headers['x-forwarded-proto'].split(',')[0].trim()
    }
    if (!protocol) {
      protocol = request.server.info.port === 443 ? 'https' : 'http'
    }
    const host = request.info.host
    const redirectUrl = `${protocol}://${host}/basic/complete`

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        redirect: redirectUrl,
        s3Bucket: config.get('aws.s3BucketName')
      })
    })

    const upload = await response.json()

    const absoluteuploadUrl = config.get('cdpUploaderUrl') + upload.uploadUrl
    // The payload from initiate contains two urls:
    // uploadUrl - we will use this URL in the form we're about to render. The content of this form will be sent to
    //          the CDP Uploader first, not our service.
    // statusUrl - we can poll this endpoint to find out the status of the URL. We can either remember it in the session
    //             or use the statusId query param from the redirect.

    // Optional: remember the status URL in the session for later
    request.yar.set('basic-upload', { statusUrl: upload.statusUrl })
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
