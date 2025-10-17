import { msalClient } from '../../config/azure-auth.js'
import { config } from '../../config/config.js'
import { createLogger } from '../common/helpers/logging/logger.js'

const logger = createLogger()

export const azureAuth = {
  plugin: {
    name: 'azure-auth',
    register: async (server) => {
      server.route([
        {
          method: 'GET',
          path: '/auth/login',
          options: { auth: false },
          handler: async (request, h) => {
            try {
              const authCodeUrlParameters = {
                scopes: ["openid", "profile", "email"],
                redirectUri: config.get('azure.redirectUri'),
                // use 'query' so Azure redirects with ?code=... (avoids form_post / SameSite issues)
                responseMode: 'query'
              }

              const response = await msalClient.getAuthCodeUrl(authCodeUrlParameters)
              return h.redirect(response)
            } catch (error) {
              logger.error('Azure AD login error:', error)
              return h.redirect('/error')
            }
          }
        },
        {
          method: 'GET',
          path: '/auth/callback',
          options: { auth: false },
          handler: async (request, h) => {
            try {
              const code = request.query?.code
              if (!code) {
                logger.error('Missing code on /auth/callback')
                return h.redirect('/error')
              }

              const tokenRequest = {
                code,
                scopes: ["openid", "profile", "email"],
                redirectUri: config.get('azure.redirectUri')
              }

              const response = await msalClient.acquireTokenByCode(tokenRequest)

              const account = response.account

              request.yar.set('user', {
                id: account.homeAccountId,
                email: account.username,
                name: account.name
              })

              request.cookieAuth.set({ 
                user: { id: account.homeAccountId, email: account.username, name: account.name },
                isAuthenticated: true 
              })

              return h.redirect('/Uploader')
            } catch (error) {
              logger.error('Azure AD callback error:', error)
              return h.redirect('/error')
            }
          }
        },
        {
          method: 'GET',
          path: '/auth/logout',
          options: { auth: false },
          handler: async (request, h) => {
            request.cookieAuth.clear()
            request.yar.clear()
            // Set Azure AD logout with post_logout_redirect_uri to /auth/logged-out
            // const postLogoutRedirect = `${config.get('azure.redirectUri').replace(/\/auth\/callback.*/, '/auth/logged-out')}`
            const logoutUri = `https://login.microsoftonline.com/${config.get('azure.tenantId')}/oauth2/v2.0/logout?post_logout_redirect_uri=https://localhost:6677/auth/logged-out/`
            return h.redirect(logoutUri)
          }
        }
        ,
        {
          method: 'GET',
          path: '/auth/session',
          options: { auth: false },
          handler: (request, h) => {
            return h.response({
              yar: request.yar ? request.yar.get('user') : null,
              cookieCredentials: request.auth && request.auth.credentials ? request.auth.credentials : null
            })
          }
        }
      ])
    }
  }
}