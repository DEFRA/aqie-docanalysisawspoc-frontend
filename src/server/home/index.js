// import { createLogger } from '../common/helpers/logging/logger.js'

// const logger = createLogger()

export const home = {
  plugin: {
    name: 'home',
    register: async (server) => {
      server.route([
        {
          method: 'GET',
          path: '/',
          handler: (request, h) => {
            // const user = request.auth.credentials.user
            return h.redirect('/cdpUploader')
          }
        }
      ])
    }
  }
}
