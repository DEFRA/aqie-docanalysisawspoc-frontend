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

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        redirect: `/basic/complete`, // <-- Use relative URI as required by the uploader
        s3Bucket: config.get('aws.s3BucketName')
      })
    })

    const upload = await response.json()
    logger.info(`Upload API response: ${JSON.stringify(upload)}`)
    if (!response.ok) {
      // Something went wrong - log and show error page
      logger.error(`Upload API error: ${upload.message || response.statusText}`)
      throw new Error(`Upload API error: ${upload.message || response.statusText}`)
    }
    // Use the reverse proxy for uploadUrl and statusUrl
    const uploadUrl = config.get('cdpUploaderUrl')+upload.uploadUrl
    // The payload from initiate contains two urls:
    // uploadUrl - we will use this URL in the form we're about to render. The content of this form will be sent to
    //          the CDP Uploader first, not our service.
    // statusUrl - we can poll this endpoint to find out the status of the URL. We can either remember it in the session
    //             or use the statusId query param from the redirect.

    // Optional: remember the status URL in the session for later
    request.yar.set('basic-upload', { statusUrl: upload.statusUrl })
    logger.info(`Upload URL: ${uploadUrl}`)
    logger.info(`Status URL: ${upload.statusUrl}`)

    // Next, render the form passing in the uploadUrl. This is just a simple HTML form that makes a multipart/form-data request
    return h.view('basic-upload/views/basic-upload-form', {
      pageTitle: 'Basic CDP-Uploader example',
      action: uploadUrl,
      heading: 'Basic upload example'
    })
  }
}

export { basicUploadFormController }
