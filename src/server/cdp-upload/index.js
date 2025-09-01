import { cdpUploadFormController } from '~/src/server/cdp-upload/controllers/cdp-upload-form'
import { cdpUploadCompleteController } from '~/src/server/cdp-upload/controllers/cdp-upload-complete'

const basicUpload = {
  plugin: {
    name: 'basic',
    register: async (server) => {
      server.route([
        {
          method: 'GET',
          path: '/basic',
          ...cdpUploadFormController
        },
        {
          method: 'GET',
          path: '/basic/complete',
          ...cdpUploadCompleteController
        }
      ])
    }
  }
}

export { basicUpload }
