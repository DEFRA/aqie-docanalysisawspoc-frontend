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
            const backendApiUrl = config.get('backendApiUrl')
            
            // Check if results already exist
            try {
              const response = await axios.get(`${backendApiUrl}/gets3/${requestId}`)
              
              if (response.data && response.data.getS3result) {
                return h.view('status/index', {
                  isAuthenticated: true,
                  user: user,
                  requestId: requestId,
                  status: 'complete',
                  markdownContent: response.data.getS3result
                })
              }
            } catch (error) {
              // Results not ready yet, show polling state
            }
            
            return h.view('status/index', {
              isAuthenticated: true,
              user: user,
              requestId: requestId,
              status: 'polling',
              markdownContent: null
            })
          }
        },
        {
          method: 'GET',
          path: '/progress/{requestId}',
          options: { auth: { strategy: 'login', mode: 'required' } },
          handler: async (request, h) => {
            const { requestId } = request.params
            const backendApiUrl = config.get('backendApiUrl')
            
            try {
              const response = await axios.get(`${backendApiUrl}/gets3/${requestId}`)
              
              if (response.data && response.data.getS3result) {
                return h.response({
                  status: 'complete',
                  content: response.data.getS3result
                })
              }
              
              return h.response({
                status: 'processing',
                content: '🔄 **Processing your document analysis...**\n\nPlease wait while our AI service analyzes your document. This may take a few moments.'
              })
              
            } catch (error) {
              return h.response({
                status: 'processing',
                content: '⏳ **Fetching analysis results...**\n\nConnecting to our AI service to retrieve your document analysis.'
              })
            }
          }
        }
      ])
    }
  }
}