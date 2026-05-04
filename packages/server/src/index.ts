import Fastify from 'fastify'
import fastifyWebsocket from '@fastify/websocket'
import fastifyStatic from '@fastify/static'
import { WebSocketServer } from 'ws'
import path from 'path'
import { handleConnection } from './wsHandler'

const app = Fastify({ logger: true })
const PORT = Number(process.env.PORT) || 3000

async function bootstrap() {
  await app.register(fastifyWebsocket)

  const publicDir = path.join(__dirname, '../public')
  try {
    await app.register(fastifyStatic, { root: publicDir, prefix: '/' })
  } catch {
    // public ディレクトリがない場合（開発環境）はスキップ
  }

  const wss = new WebSocketServer({ noServer: true })
  wss.on('connection', handleConnection)

  app.server.on('upgrade', (req, socket, head) => {
    if (req.url === '/ws') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req)
      })
    } else {
      socket.destroy()
    }
  })

  app.get('/health', async () => ({ status: 'ok' }))

  await app.listen({ port: PORT, host: '0.0.0.0' })
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
