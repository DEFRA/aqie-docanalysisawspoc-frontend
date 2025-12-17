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

function getAllowedAnalysisTypes(userEmail, analysisTypeMapping = {}) {
  const allowedAnalysisTypes = []

  const normalize = (v) => (v || '').toString().trim().toLowerCase()

  const makeList = (val) => {
    if (!val) return []
    if (Array.isArray(val)) return val.map(normalize).filter(Boolean)
    if (typeof val === 'string') {
      return val.split(',').map(normalize).filter(Boolean)
    }
    return []
  }

  const email = normalize(userEmail)

  const redList = makeList(analysisTypeMapping && analysisTypeMapping.red)
  const greenList = makeList(analysisTypeMapping && analysisTypeMapping.green)
  const icbList = makeList(analysisTypeMapping && analysisTypeMapping.icb)
  const ebList = makeList(analysisTypeMapping && analysisTypeMapping.eb)

  if (redList.includes(email)) {
    allowedAnalysisTypes.push({ key: 'red', label: '🔴 Red team' })
  }
  if (greenList.includes(email)) {
    allowedAnalysisTypes.push({ key: 'green', label: '📗 Green book' })
  }
  if (icbList.includes(email)) {
    allowedAnalysisTypes.push({
      key: 'investment',
      label: '📊 Investment committee briefing'
    })
  }
  if (ebList.includes(email)) {
    allowedAnalysisTypes.push({
      key: 'executive',
      label: '💼 Executive briefing'
    })
  }

  // Always add compare option
  allowedAnalysisTypes.push({
    key: 'comparingTwoDocuments',
    label: '📄 Compare two documents'
  })

  return allowedAnalysisTypes
}

export { initUpload, getAllowedAnalysisTypes }
