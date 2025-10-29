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
      mimeTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
      ]
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

function getAllowedAnalysisTypes(userEmail, analysisTypeMapping) {
  const allowedAnalysisTypes = []
  if (analysisTypeMapping.red && analysisTypeMapping.red.includes(userEmail)) {
    allowedAnalysisTypes.push({ key: 'red', label: '🔴 Red team' })
  }
  if (analysisTypeMapping.green && analysisTypeMapping.green.includes(userEmail)) {
    allowedAnalysisTypes.push({ key: 'green', label: '📗 Green book' })
  }
  if (analysisTypeMapping.icb && analysisTypeMapping.icb.includes(userEmail)) {
    allowedAnalysisTypes.push({ key: 'icb', label: '📊 Investment committee briefing' })
  }
  if (analysisTypeMapping.eb && analysisTypeMapping.eb.includes(userEmail)) {
    allowedAnalysisTypes.push({ key: 'eb', label: '💼 Executive briefing' })
  }
  // Always add compare option
  allowedAnalysisTypes.push({ key: 'compare', label: '📄 Compare two documents' })
  
  return allowedAnalysisTypes
}

export { initUpload, getAllowedAnalysisTypes }
