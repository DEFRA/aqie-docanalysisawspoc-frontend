import inert from '@hapi/inert'
import { health } from './health/index.js'
import { upload } from './upload/index.js'
import { status } from './status/index.js'
import { home } from './home/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'
import { login } from './login/index.js'
import { queue } from './queue/index.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      await server.register([health])

      await server.register([login, upload, status, queue])

      await server.register([serveStaticFiles])
    }
  }
}
