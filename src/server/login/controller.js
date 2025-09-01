import { config } from '../../config/config.js'
const sessionConfig = config.get('session')
const password = sessionConfig.cookie.docPassword
const loginController = {
  handler: (request, h) => {
    if (request.auth.isAuthenticated) {
      console.log('Inside Login Controller')
      return h.redirect('/upload')
    } else {
      const errors = request.yar.get('errors')
      const errorMessage = request.yar.get('errorMessage')
      request.yar.set('errors', null)
      request.yar.set('errorMessage', null)
      return h.view('login/index', {
        pageTitle: 'Login Page - GOV.UK',
        heading: 'Login Page',
        page: 'upload',
        serviceName: 'Business Case Summarisation',
        isAuthenticated: request.auth.isAuthenticated,
        errors: errors?.errors,
        errorMessage: errorMessage?.errorMessage
      })
    }
  }
}

const authController = {
  handler: (request, h) => {
    if (request.payload.password === password) {
      console.log('Inside auth Controller')
      //once user loggedin , set the cookie with user data and send back cookie with authentication
      //this info will also be validated in serverside using validate function
      request.cookieAuth.set({ password: request.payload.password })
      return h.redirect('/upload')
    } else {
      request.yar.set('errors', {
        errors: {
          titleText: 'There is a problem',
          errorList: [
            {
              text: 'The password is not correct',
              href: '#password'
            }
          ]
        }
      })
      request.yar.set('errorMessage', {
        errorMessage: {
          text: 'The password is not correct'
        }
      })
      return h.redirect('/')
    }
  }
}

export { loginController, authController }
