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
            logger.info(
              `Status check for requestId: ${requestId}, backend URL: ${backendApiUrl}`
            )
            try {
              const response = await axios.get(
                `${backendApiUrl}/getS3/${requestId}`
              )

              if (
                response.data &&
                response.data.getS3result &&
                response.data.getS3result.status === 'completed'
              ) {
                const content =
                  JSON.stringify(
                    response.data.getS3result?.result?.content.find(
                      (item) => item.type === 'text'
                    )?.text
                  ) || 'No text found'
                return h.view('status/index', {
                  isAuthenticated: true,
                  user: user,
                  requestId: requestId,
                  status: 'completed',
                  markdownContent: content
                })
              }
            } catch (error) {
              logger.info(
                `Status check error for ${requestId}: ${error.message}`
              )
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
              const response = await axios.get(
                `${backendApiUrl}/getS3/${requestId}`
              )

              if (
                response.data &&
                response.data.getS3result &&
                response.data.getS3result.status === 'completed'
              ) {
                const content =
                  JSON.stringify(
                    response.data.getS3result?.result?.content.find(
                      (item) => item.type === 'text'
                    )?.text
                  ) || 'No text found'
                return h.response({
                  status: 'completed',
                  content: content
                })
              }

              return h.response({
                status: 'processing',
                content:
                  '🔄 **Processing your document analysis...**\n\nPlease wait while our AI service analyzes your document. This may take a few moments.'
              })
            } catch (error) {
              logger.error(`Backend error for ${requestId}: ${error.message}`)
              logger.error(
                `Error details:`,
                error.response?.status,
                error.response?.data
              )
              return h.response({
                status: 'processing',
                content:
                  '⏳ **Fetching analysis results...**\n\nConnecting to our AI service to retrieve your document analysis.'
              })
            }
          }
        }
      ])
    }
  }
}
