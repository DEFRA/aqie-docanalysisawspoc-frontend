import { uploadstatusController } from './controller.js'

export const uploadStatus = {
  plugin: {
    name: 'uploadStatus',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/upload_status/poll-status',
          ...uploadstatusController
        }
      ])
    }
  }
}
