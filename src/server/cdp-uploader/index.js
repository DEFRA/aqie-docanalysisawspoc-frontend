import { basicUploadFormController } from '../../server/cdp-uploader/controllers/basic-upload-form.js'
import { baseUploadCompleteController, cdpUploaderCompleteController } from '../../server/cdp-uploader/controllers/basic-upload-complete.js'

const cdpUploader = {
  plugin: {
    name: 'cdp-uploader',
    register: async (server) => {
      server.route([
        {
          method: 'GET',
          path: '/cdpUploader',
          options: { auth: { strategy: 'login', mode: 'required' } },
          ...basicUploadFormController
        },
        {
          method: 'GET',
          path: '/cdpUploader/complete',
          options: { auth: { strategy: 'login', mode: 'required' } },
          ...baseUploadCompleteController
        },
        {
          method: 'GET',
          path: '/cdpUploader/status',
          options: { auth: { strategy: 'login', mode: 'required' } },
          ...cdpUploaderCompleteController
        }
      ])
    }
  }
}

export { cdpUploader }
