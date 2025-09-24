import { basicUploadFormController } from '../../server/cdp-uploader/controllers/basic-upload-form.js'
import {
  baseUploadCompleteController,
  cdpUploaderCompleteController,
  cdpUploaderBackController
} from '../../server/cdp-uploader/controllers/basic-upload-complete.js'

const cdpUploader = {
  plugin: {
    name: 'cdp-uploader',
    register: async (server) => {
      server.route([
        {
          method: 'POST',
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
          method: 'GET',
          path: '/Uploader',
          options: { auth: { strategy: 'login', mode: 'required' } },
          ...cdpUploaderBackController
        }
      ])
    }
  }
}

export { cdpUploader }
