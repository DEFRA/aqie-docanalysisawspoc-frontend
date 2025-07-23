import { uploadController } from './controller.js'

/**
 * Sets up the routes used in the home page.
 * These routes are registered in src/server/router.js.
 */
export const upload = {
  plugin: {
    name: 'upload',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/upload',
          ...uploadController
        }
      ])
    }
  }
}
