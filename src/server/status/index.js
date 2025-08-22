import { createLogger } from '../common/helpers/logging/logger.js'
import { config } from '../../config/config.js'
import axios from 'axios'

const logger = createLogger()

export const status = {
  plugin: {
    name: 'status',
    register: async (server) => {
      server.route([
        {
          method: 'GET',
          path: '/status/{requestId}',
          options: { auth: { strategy: 'login', mode: 'required' } },
          handler: async (request, h) => {
            const { requestId } = request.params
            const user = request.auth.credentials.user
            
            return h.view('status/index', {
              isAuthenticated: true,
              user: user,
              requestId: requestId
            })
          }
        },
        {
          method: 'GET',
          path: '/checkstatus/{requestId}',
          options: { auth: { strategy: 'login', mode: 'required' } },
          handler: async (request, h) => {
            const { requestId } = request.params
            
            try {
              const backendApiUrl = config.get('backendApiUrl')
              const response = await axios.get(`${backendApiUrl}/gets3/${requestId}`)
              
              return h.response(response.data).code(200)
            } catch (error) {
              logger.error(`Error checking status: ${error.message}`)
              return h.response({ 
                status: 'error', 
                message: 'Failed to check status' 
              }).code(500)
            }
          }
        }
      ])
    }
  }
}