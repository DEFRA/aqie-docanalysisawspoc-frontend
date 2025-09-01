import { config } from '~/src/config'

const cdpUploadFormController = {
  options: {},
  handler: async (request, h) => {
    // Clear any session data.
    request.yar.clear('cdp-upload')

    // First, initiate the upload by calling the CDP-Uploader's initiate API.
    const endpointUrl = config.get('cdpUploaderUrl') + '/initiate'

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        redirect: '/basic/complete',
        s3Bucket: config.get('bucket')
      })
    })

    const upload = await response.json()
    // The payload from initiate contains two urls:
    // uploadUrl - we will use this URL in the form we're about to render. The content of this form will be sent to
    //          the CDP Uploader first, not our service.
    // statusUrl - we can poll this endpoint to find out the status of the URL. We can either remember it in the session
    //             or use the statusId query param from the redirect.

    // Optional: remember the status URL in the session for later
    request.yar.set('cdp-upload', { statusUrl: upload.statusUrl })

    // Next, render the form passing in the uploadUrl. This is just a simple HTML form that makes a multipart/form-data request
    return h.view('cdp-upload/views/cdp-upload-form', {
      pageTitle: 'CDP-Uploader example',
      action: upload.uploadUrl,
      heading: 'CDP upload example'
    })
  }
}

export { cdpUploadFormController }
