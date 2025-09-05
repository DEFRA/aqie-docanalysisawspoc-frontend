import { basicUploadFormController } from '../../server/basic-upload/controllers/basic-upload-form.js'
import { baseUploadCompleteController } from '../../server/basic-upload/controllers/basic-upload-complete.js'

const basicUpload = {
  plugin: {
    name: 'basic',
    register: async (server) => {
      server.route([
        {
          method: 'GET',
          path: '/basic',
          ...basicUploadFormController
        },
        {
          method: 'GET',
          path: '/basic/complete',
          ...baseUploadCompleteController
        }
      ])
    }
  }
}

export { basicUpload }
