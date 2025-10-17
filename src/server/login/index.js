import { loginController } from './controller.js'

const login = {
  plugin: {
    name: 'login',
    register: async (server) => {
      server.route([
        {
          method: 'GET',
          path: '/',
          ...loginController,
          // This route will be used to display the login page
          options: { auth: { strategy: 'login', mode: 'try' } } //access login page without cookie set , hapi will try to authenticate the user, if fails, the reoute can still be accessed
        },
        {
          method: 'GET',
          path: '/logout',
          options: { auth: false },
          handler: (request, h) => {
            // Ensure both cookie auth and server-side session are cleared
            try {
              request.cookieAuth.clear()
            } catch (e) {
              // ignore if not present
            }
            try {
              request.yar && request.yar.clear()
            } catch (e) {
              // ignore
            }
            return h.redirect('/')
          }
        }
      ])
    }
  }
}

export { login }
