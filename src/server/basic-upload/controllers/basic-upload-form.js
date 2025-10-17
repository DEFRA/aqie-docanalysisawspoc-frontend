import { config } from '../../../config/config.js'
import { createLogger } from '../../common/helpers/logging/logger.js'
import { initUpload } from '../helper/init-upload.js'

const logger = createLogger()
const basicUploadFormController = {
  options: {},
  handler: async (request, h) => {
    // Clear any session data.
    request.yar.clear('basic-upload')
    const redirect = '/basic/complete' // <-- Use relative URI as required by the uploader
    const s3Bucket = config.get('aws.s3BucketName')

    const secureUpload = await initUpload({
      redirect,
      s3Bucket
    })
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
    }
    logger.info(`Upload URL: ${secureUpload.uploadUrl}`)
    logger.info(`Status URL: ${secureUpload.statusUrl}`)

    // Next, render the form passing in the uploadUrl. This is just a simple HTML form that makes a multipart/form-data request
    return h.view('basic-upload/views/basic-upload-form', {
      pageTitle: 'Basic CDP-Uploader example',
      action: secureUpload.uploadUrl,
      heading: 'Basic upload example'
    })
  }
}

export { basicUploadFormController }
