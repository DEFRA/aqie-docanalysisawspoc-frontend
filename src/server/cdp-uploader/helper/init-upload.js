import fetch from 'node-fetch'

import { config } from '../../../config/config.js'
import { createLogger } from '../../common/helpers/logging/logger.js'

const logger = createLogger()
async function initUpload(options = {}) {
  const { redirect, s3Bucket } = options

  const endpointUrl = config.get('cdpUploaderUrl') + '/initiate'
  logger.info(`Inside: initUpload() - Initiate endpoint URL: ${endpointUrl}`)
  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      redirect,
      s3Bucket,
      maxFileSize: '10MB',
      mimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    })
  })
  if (!response.ok) {
    // Something went wrong - log and show error page
    logger.error(`Upload API error: ${response.message || response.statusText}`)
    throw new Error(
      `Upload API error: ${response.message || response.statusText}`
    )
  }
  // TODO handle response errors
  return await response.json()
}

export { initUpload }
