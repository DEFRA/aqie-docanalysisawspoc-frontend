import { basicUploadFormController } from '../../server/cdp-uploader/controllers/basic-upload-form.js'
import {
  baseUploadCompleteController,
  cdpUploaderCompleteController,
  cdpUploaderCompareController
} from '../../server/cdp-uploader/controllers/basic-upload-complete.js'

const cdpUploader = {
  plugin: {
    name: 'cdp-uploader',
    register: async (server) => {
      server.route([
        {
          method: 'GET',
          path: '/Uploader',
          options: { auth: { strategy: 'login', mode: 'required' } },
          ...basicUploadFormController
        },
        {
          method: 'GET',
          path: '/Uploader/complete',
          options: { auth: { strategy: 'login', mode: 'required' } },
          ...baseUploadCompleteController
        },
        {
          method: 'GET',
          path: '/Uploader/status',
          options: { auth: { strategy: 'login', mode: 'required' } },
          ...cdpUploaderCompleteController
        },

        {
          method: 'POST',
          path: '/Uploader/compare',
          options: {
            auth: { strategy: 'login', mode: 'required' },
            payload: {
              output: 'stream',
              parse: true,
              multipart: true,
              maxBytes: 50 * 1024 * 1024
            }
          },
          ...cdpUploaderCompareController
        }
      ])
    }
  }
}

export { cdpUploader }
