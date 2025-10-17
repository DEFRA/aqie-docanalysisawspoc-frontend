import { ConfidentialClientApplication } from '@azure/msal-node'
import { config } from './config.js'

export const msalConfig = {
  auth: {
    clientId: config.get('azure.clientId'),
    authority: `https://login.microsoftonline.com/${config.get('azure.tenantId')}`,
    clientSecret: config.get('azure.clientSecret')
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message) => {
        console.log(message)
      },
      piiLoggingEnabled: false,
      logLevel: 'Info'
    }
  }
}

// Validate required config values at runtime to provide a clear error if any are missing.
const clientId = config.get('azure.clientId')
const clientSecret = config.get('azure.clientSecret')
const tenantId = config.get('azure.tenantId')

if (!clientId || !tenantId) {
  throw new Error(
    'Azure AD SSO configuration missing: make sure AZURE_CLIENT_ID and AZURE_TENANT_ID are set in your environment/config'
  )
}

if (!clientSecret) {
  throw new Error(
    'Azure AD SSO configuration missing: AZURE_CLIENT_SECRET is empty. For a confidential (server-side) app MSAL requires a client secret or certificate.\n' +
      'Set AZURE_CLIENT_SECRET in your environment (locally: export AZURE_CLIENT_SECRET="<secret>") or use a public client flow (Authorization Code + PKCE) if you do not want to use a secret.'
  )
}

export const msalClient = new ConfidentialClientApplication(msalConfig)
