import { loginController, authController } from './controller.js'

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
          method: 'POST',
          path: '/',
          ...authController,
          options: { auth: { strategy: 'login', mode: 'try' } }
        },
        {
          method: 'GET',
          path: '/logout',
          handler: (request, h) => {
            request.cookieAuth.clear()
            return h.redirect('/')
          }
        }
      ])
    }
  }
}

export { login }
