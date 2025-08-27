import { config } from '../../config/config.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import axios from 'axios'
import FormData from 'form-data'

const logger = createLogger()

export const cdpUpload = {
  plugin: {
    name: 'cdp-upload',
    register: async (server) => {
      server.route([
        {
          method: 'POST',
          path: '/cdp-upload',
          options: {
            auth: { strategy: 'login', mode: 'required' },
            payload: {
              output: 'stream',
              parse: true,
              multipart: true,
              maxBytes: 50 * 1024 * 1024 // 50MB limit
            }
          },
          handler: async (request, h) => {
            try {
              const cdpUploaderUrl = config.get('cdpUploaderUrl')
              const s3BucketName = config.get('aws.s3BucketName')
              const analysisType = request.query.analysisType || 'green'
              const model = request.query.model || 'model1'
              const baseUrl = `${request.server.info.protocol}://${request.info.host}`

              const file = request.payload.policyPdf
              if (!file) {
                return h.redirect(
                  `/upload?status=error&message=${encodeURIComponent('No file provided')}`
                )
              }

              // Call /initiate to get upload configuration
              const response = await fetch(`${cdpUploaderUrl}/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  redirect: `/cdp-upload/poll-status`,
                  s3Bucket: s3BucketName
                })
              })

              const upload = await response.json()

              const { uploadUrl, uploadId, statusUrl } = upload

              // Return upload form that will submit to CDP uploader directly
              return h.view('cdp-upload/upload-form', {
                uploadUrl,
                uploadId,
                statusUrl,
                analysisType,
                model,
                isAuthenticated: true,
                user: request.auth.credentials.user
              })
            } catch (error) {
              logger.error(
                'CDP Upload initiate error:',
                error.response?.data || error.message
              )
              logger.error('Error status:', error.response?.status)
              return h.redirect(
                `/upload?status=error&message=${encodeURIComponent('Upload initiation failed')}`
              )
            }
          }
        },
        {
          method: 'GET',
          path: '/cdp-upload/poll-status',
          options: {
            auth: { strategy: 'login', mode: 'required' }
          },
          handler: async (request, h) => {
            try {
              const { statusUrl, analysisType, model } = request.query

              const response = await axios.get(statusUrl)
              const { uploadStatus, files } = response.data

              if (uploadStatus === 'ready' && files?.length > 0) {
                const s3Key = files[0].s3Key

                // Trigger processing
                return h.response({
                  status: 'ready',
                  s3Key,
                  analysisType,
                  model,
                  message: 'File ready for processing'
                })
              }

              return h.response({ status: uploadStatus })
            } catch (error) {
              logger.error('Status polling error:', error)
              return h.response({ error: 'Status check failed' }).code(500)
            }
          }
        },
        {
          method: 'GET',
          path: '/cdp-upload/status/{uploadId}',
          options: {
            auth: { strategy: 'login', mode: 'required' }
          },
          handler: async (request, h) => {
            try {
              const { uploadId } = request.params
              const cdpUploaderUrl = config.get('cdpUploaderUrl')

              const response = await axios.get(
                `${cdpUploaderUrl}/status/${uploadId}`
              )

              return h.response(response.data).code(200)
            } catch (error) {
              logger.error('Status check error:', error)
              return h.response({ error: 'Status check failed' }).code(500)
            }
          }
        }
      ])
    }
  }
}
