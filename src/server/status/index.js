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
            logger.info(`Status check for requestId: ${requestId}, backend URL: ${backendApiUrl}`)
            try {

              const response = await axios.get(`${backendApiUrl}/getS3/01f62de7-6b31-4057-bba8-c061f257df20`)
              logger.info(`Status check response status: ${response.status}`)
              logger.info(`Status check response data: ${JSON.stringify(response.data)}`)
              logger.info(`Status check response data getS3Result: ${JSON.stringify(response.data.getS3result)}`)
              logger.info(`Status check response status: ${JSON.stringify(response.data.getS3result.status)}`)
              let result = JSON.stringify(response.data);

              if (result && result.getS3result.status === 'completed') {
                return h.view('status/index', {
                  isAuthenticated: true,
                  user: user,
                  requestId: requestId,
                  status: 'completed',
                  markdownContent: result.getS3result
                })
              }
            } catch (error) {
              logger.info(`Status check error for ${requestId}: ${error.message}`)
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

            logger.info(`Progress check for requestId: ${requestId}`)
            logger.info(`Backend API URL: ${backendApiUrl}`)
            logger.info(`Full backend URL: ${backendApiUrl}/getS3/${requestId}`)

            try {

              const response = await axios.get(`${backendApiUrl}/getS3/01f62de7-6b31-4057-bba8-c061f257df20`)
              let result = JSON.stringify(response.data);
              logger.info(`Backend response status: ${response.status}, has result: ${!!(response.data && response.data.getS3result)}`)
              logger.info(`Progress check response status: ${response.status}`)
              logger.info(`Progress check response data: ${JSON.stringify(response.data)}`)
              logger.info(`Progress check response data getS3Result: ${JSON.stringify(response.data.getS3result)}`)
              logger.info(`Progress check response status: ${JSON.stringify(response.data.getS3result.status)}`)


              if (result && result.getS3result.status === 'completed') {
                return h.response({
                  status: 'completed',
                  content: result.getS3result
                })
              }

              return h.response({
                status: 'processing',
                content: '🔄 **Processing your document analysis...**\n\nPlease wait while our AI service analyzes your document. This may take a few moments.'
              })

            } catch (error) {
              logger.error(`Backend error for ${requestId}: ${error.message}`)
              logger.error(`Error details:`, error.response?.status, error.response?.data)
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