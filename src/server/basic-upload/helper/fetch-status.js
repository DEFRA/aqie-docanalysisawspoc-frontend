import fetch from 'node-fetch'

import { config } from '../../../config/config.js'
import { createLogger } from '../../common/helpers/logging/logger.js'

const logger = createLogger()
async function fetchStatus(id) {
  const endpointUrl = config.get('cdpUploaderUrl') + `/status/${id}`

  logger.info(`Inside fetchStatus()`)
  const response = await fetch(endpointUrl, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })

  // TODO handle response errors
  return await response.json()
}

export { fetchStatus }
