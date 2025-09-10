import { s3Client } from '../../common/helpers/s3-client.js'
import { HeadObjectCommand } from '@aws-sdk/client-s3'
import { createLogger } from '../../common/helpers/logging/logger.js'

const logger = createLogger()

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
    logger.info(
      `'Status URL from session its from complete comtroller:',
      ${statusUrl}`
    )
    // You'll likely want to handle the statusUrl not being set more gracefully than this!

    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    const status = await response.json()
    logger.info(`'Status response from cdp-uploader:', ${JSON.stringify(status)}`)
    // 1. Check uploadStatus. UploadStatus can either be 'pending' (i.e. file is still being scanned) or 'ready'
    if (status.uploadStatus !== 'ready') {
      // If its not ready show the holding page. The holding page shows a please wait message and auto-reloads
      // after x seconds, causing this whole controller to run again, checking the status.

      return h.view('basic-upload/views/basic-upload-wait', {
        pageTitle: 'Virus check',
        heading: 'Scanning your files',
        status: JSON.stringify(status, null, 2)
      })
    }

    // 2. Handle the file not being selected (optional).
    //
    // The 'form' field of the status is basically the content of the multipart/form-data form.
    // We can handle it just like handling a normal POST request. If no file is selected the basicfile field of the form
    // will be missing.
    if (!status.form.basicfile) {
      request.yar.flash('basic-upload', {
        formErrors: { basicfile: { message: 'Select a file' } }
      })
      return h.redirect('/basic')
    }

    // 3. Check if the uploader had any errors (viruses, zero size file, failed to uploaded etc)
    //
    // If the uploaded file has an error, the basicfile field will have a 'hasError' field set to 'true' and
    // an 'errorMessage' field populated with the failure reason.
    if (status.form.basicfile?.hasError === true) {
      // The errorMessage field uses the GDS standard file upload error messages so can be presented directly to users.
      // see: https://design-system.service.gov.uk/components/file-upload/
      request.yar.flash('basic-upload', {
        formErrors: {
          basicfile: { message: status.form.basicfile.errorMessage }
        }
      })
      return h.redirect('/basic')
    }

    // 4. Handle the clean file
    // Unlike an actual multipart/form-data form, instead of the actual file data you get an S3 bucket & key reference
    // to where your file can be accessed. From here it is up to you what do you do with this information!

    const s3Key = status.form.basicfile.s3Key
    const s3Bucket = status.form.basicfile.s3Bucket

    // For demo purposes and to prove we've actually received the file, we'll get the S3 object's metadata.
    // In your app you likely want to do something different with the file!
    const metadata = await s3Client.send(
      new HeadObjectCommand({
        Bucket: s3Bucket,
        Key: s3Key
      })
    )
    return h.view('basic-upload/views/basic-upload-complete', {
      heading: 'Basic upload example',
      metadata: JSON.stringify(metadata, null, 2)
    })
  }
}

export { baseUploadCompleteController }
