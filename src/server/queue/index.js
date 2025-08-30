import { createLogger } from '../common/helpers/logging/logger.js'
import { config } from '../../config/config.js'
import axios from 'axios'

const logger = createLogger()

// In-memory queue for upload requests
const uploadQueue = new Map()

export const queue = {
  plugin: {
    name: 'queue',
    register: async (server) => {
      
      function startBackgroundPolling(uploadId, requestId) {
        const pollInterval = setInterval(async () => {
          try {
            // Mock backend response for testing
            const mockResponse = {
              data: {
                getS3result: {
                  status: 'completed',
                  result: {
                    content: [{
                      type: 'text',
                      text: `Mock analysis result for ${requestId}`
                    }]
                  }
                }
              }
            }
            
            const upload = uploadQueue.get(uploadId)
            if (!upload) {
              clearInterval(pollInterval)
              return
            }
            
            // Simulate random completion after 30-60 seconds
            const elapsedTime = Date.now() - new Date(upload.timestamp).getTime()
            if (elapsedTime > 30000 + Math.random() * 30000) {
              upload.status = 'completed'
              uploadQueue.set(uploadId, upload)
              clearInterval(pollInterval)
              logger.info(`Upload ${uploadId} completed successfully`)
            }
          } catch (error) {
            logger.info(`Polling error for ${uploadId}: ${error.message}`)
          }
        }, 10000)
        
        setTimeout(() => {
          clearInterval(pollInterval)
          const upload = uploadQueue.get(uploadId)
          if (upload && upload.status === 'analyzing') {
            upload.status = 'failed'
            upload.error = 'Analysis timeout'
            uploadQueue.set(uploadId, upload)
          }
        }, 600000)
      }
      server.route([
        {
          method: 'GET',
          path: '/queue',
          options: { auth: { strategy: 'login', mode: 'required' } },
          handler: (request, h) => {
            const user = request.auth.credentials.user
            const userUploads = Array.from(uploadQueue.values())
              .filter(upload => upload.userId === user.id)
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            
            return h.view('queue/index', {
              isAuthenticated: true,
              user: user,
              uploads: userUploads
            })
          }
        },
        {
          method: 'POST',
          path: '/queue/upload',
          options: {
            auth: { strategy: 'login', mode: 'required' },
            payload: {
              output: 'stream',
              parse: true,
              multipart: true,
              maxBytes: 50 * 1024 * 1024
            }
          },
          handler: async (request, h) => {
            const { payload } = request
            const user = request.auth.credentials.user
            const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            
            const uploadRequest = {
              id: uploadId,
              userId: user.id,
              filename: payload.policyPdf?.hapi?.filename || 'unknown.pdf',
              analysisType: payload.analysisType,
              model: payload.model || 'model1',
              status: 'uploading',
              timestamp: new Date().toISOString(),
              requestId: null
            }
            
            uploadQueue.set(uploadId, uploadRequest)
            
            // Process upload asynchronously
            processUpload(uploadId, payload).catch(error => {
              logger.error(`Upload processing failed for ${uploadId}: ${error.message}`)
              const upload = uploadQueue.get(uploadId)
              if (upload) {
                upload.status = 'failed'
                upload.error = error.message
                uploadQueue.set(uploadId, upload)
              }
            })
            
            return h.response({ uploadId, status: 'queued' }).code(202)
          }
        },
        {
          method: 'GET',
          path: '/queue/mock/{requestId}',
          options: { auth: { strategy: 'login', mode: 'required' } },
          handler: (request, h) => {
            const { requestId } = request.params
            const mockContent = `# Analysis Results for ${requestId}\n\n## Summary\n\nThis is a mock analysis result for testing the queue system.\n\n### Key Findings\n\n- ✅ Mock finding 1\n- ⚠️ Mock finding 2\n- 📊 Mock finding 3`
            
            return h.view('status/index', {
              isAuthenticated: true,
              user: request.auth.credentials.user,
              requestId: requestId,
              status: 'completed',
              markdownContent: mockContent
            })
          }
        },
        {
          method: 'GET',
          path: '/queue/status',
          options: { auth: { strategy: 'login', mode: 'required' } },
          handler: (request, h) => {
            const user = request.auth.credentials.user
            const userUploads = Array.from(uploadQueue.values())
              .filter(upload => upload.userId === user.id)
            
            return h.response(userUploads)
          }
        }
      ])
    }
  }
}

async function processUpload(uploadId, payload) {
  const upload = uploadQueue.get(uploadId)
  if (!upload) return
  
  try {
    upload.status = 'processing'
    uploadQueue.set(uploadId, upload)
    

    // // Simulate file processing and backend call
    // const backendApiUrl = config.get('backendApiUrl')
    
    // const response = await axios.post(`${backendApiUrl}/summarize`, {
    //   systemprompt: getPromptByType(upload.analysisType),
    //   userprompt: 'Mock PDF content for demo',
    //   modelid: upload.model
    // })

    // Mock processing without backend call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const mockRequestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    
    upload.requestId = mockRequestId
    upload.status = 'analyzing'
    uploadQueue.set(uploadId, upload)
    
    // Mock completion after 30-60 seconds
    setTimeout(() => {
      const finalUpload = uploadQueue.get(uploadId)
      if (finalUpload && finalUpload.status === 'analyzing') {
        finalUpload.status = 'completed'
        uploadQueue.set(uploadId, finalUpload)
        logger.info(`Upload ${uploadId} completed successfully`)
      }
    }, 30000 + Math.random() * 30000)
    
  } catch (error) {
    upload.status = 'failed'
    upload.error = error.message
    uploadQueue.set(uploadId, upload)
  }
}

function getPromptByType(analysisType) {
  switch (analysisType) {
    case 'green': return 'Green book analysis prompt'
    case 'red-investment': return 'Red Investment Committee prompt'
    case 'executive': return 'Executive briefing prompt'
    default: return 'Red book analysis prompt'
  }
}