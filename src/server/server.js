import path from 'path'

import hapi from '@hapi/hapi'
import h2o2 from '@hapi/h2o2'

import { router } from './router.js'
import { config } from '../config/config.js'
import { pulse } from './common/helpers/pulse.js'
import { catchAll } from './common/helpers/errors.js'
import { nunjucksConfig } from '../config/nunjucks/nunjucks.js'
import { setupProxy } from './common/helpers/proxy/setup-proxy.js'
import { requestTracing } from './common/helpers/request-tracing.js'
import { requestLogger } from './common/helpers/logging/request-logger.js'
import { sessionCache } from './common/helpers/session-cache/session-cache.js'
import { getCacheEngine } from './common/helpers/session-cache/cache-engine.js'
import { secureContext } from './common/helpers/secure-context/secure-context.js'
import hapiCookie from '@hapi/cookie'
async function createServer() {
  setupProxy()
  const server = hapi.server({
    host: config.get('host'),
    port: config.get('port'),
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      },
      files: {
        relativeTo: path.resolve(config.get('root'), '.public')
      },
      security: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false
        },
        xss: 'enabled',
        noSniff: true,
        xframe: true
      },
      payload: {
        maxBytes: 104857600 // 100MB, adjust as needed
      }
    },
    router: {
      stripTrailingSlash: true
    },
    cache: [
      {
        name: config.get('session.cache.name'),
        engine: getCacheEngine(config.get('session.cache.engine'))
      }
    ],
    state: {
      strictHeader: false,
      isSecure: config.get('isProduction'),
      isSameSite: 'Lax',
      encoding: 'none'
    }
  })

  // Register h2o2 for reverse proxy support
  await server.register(h2o2)
  await server.register(hapiCookie)

  const sessionConfig = config.get('session')
  const isProduction = config.get('isProduction')
  server.auth.strategy('login', 'cookie', {
    cookie: {
      name: 'cookie-password',
      path: '/',
      password: sessionConfig.cookie.password,
      isSecure: isProduction
    },
    redirectTo: '/',
    keepAlive: true,
    //to validate cookie content on each request and returns boolean(isauthenticated/not)
    validate: async (request, session) => {
      if (session.password === sessionConfig.cookie.docPassword) {
        return { isValid: true }
      } else {
        return { isValid: true }
      }
    }
  })

  //register with every route to use correct credentials with cookies
  server.auth.default({ strategy: 'login', mode: 'required' })

  await server.register([
    requestLogger,
    requestTracing,
    secureContext,
    pulse,
    sessionCache,
    nunjucksConfig,
    router // Register all the controllers/routes defined in src/server/router.js
  ])

  // Add reverse proxy route for /uploader/* to CDP Uploader service
  server.route({
    method: '*',
    path: '/uploader/{path*}',
    handler: async (request, h) => {
      // Log incoming headers and cookies for debugging
      server.logger?.info?.(
        '[Proxy] Incoming headers:',
        JSON.stringify(request.headers)
      )
      // Use h2o2 proxy handler
      return h.proxy({
        passThrough: true,
        mapUri: (req) => {
          const cdpUploaderUrl = config.get('cdpUploaderUrl')
          const path = req.params.path || ''
          return {
            uri: `${cdpUploaderUrl}/${path}`
          }
        }
      })
    }
  })

  server.ext('onPreResponse', catchAll)

  return server
}

export { createServer }
