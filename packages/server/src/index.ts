import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import { WebSocketServer } from 'ws'
import path from 'path'
import { handleConnection } from './wsHandler'
import { topicCards } from './data/topicCards'
import { wordCards } from './data/wordCards'
import { getCustomCards, addTopicCard, addWordCard, deleteTopicCard, deleteWordCard } from './cardStore'
import type { TopicCard, WordCard } from '@sekai/shared'

const app = Fastify({ logger: true })
const PORT = Number(process.env.PORT) || 3000

async function bootstrap() {
  const publicDir = path.join(__dirname, '../public')
  try {
    await app.register(fastifyStatic, { root: publicDir, prefix: '/' })
  } catch {
    // 開発環境では public/ がないためスキップ
  }

  app.get('/health', async () => ({ status: 'ok' }))

  // カード一覧
  app.get('/api/cards', async () => {
    const custom = getCustomCards()
    return {
      topicCards: [
        ...topicCards.map(c => ({ ...c, isCustom: false })),
        ...custom.topicCards.map(c => ({ ...c, isCustom: true })),
      ],
      wordCards: [
        ...wordCards.map(c => ({ ...c, isCustom: false })),
        ...custom.wordCards.map(c => ({ ...c, isCustom: true })),
      ],
    }
  })

  // お題カード追加
  app.post<{ Body: { text: string } }>('/api/cards/topic', async (req, reply) => {
    const { text } = req.body
    if (!text?.trim()) return reply.status(400).send({ error: 'text required' })
    const card: TopicCard = { id: `custom-topic-${Date.now()}`, text: text.trim() }
    addTopicCard(card)
    return { ok: true, card }
  })

  // 答えカード追加
  app.post<{ Body: { text: string } }>('/api/cards/word', async (req, reply) => {
    const { text } = req.body
    if (!text?.trim()) return reply.status(400).send({ error: 'text required' })
    const card: WordCard = { id: `custom-word-${Date.now()}`, text: text.trim() }
    addWordCard(card)
    return { ok: true, card }
  })

  // お題カード削除（カスタムのみ）
  app.delete<{ Params: { id: string } }>('/api/cards/topic/:id', async (req, reply) => {
    const ok = deleteTopicCard(req.params.id)
    return ok ? { ok: true } : reply.status(404).send({ error: 'Not found or built-in card' })
  })

  // 答えカード削除（カスタムのみ）
  app.delete<{ Params: { id: string } }>('/api/cards/word/:id', async (req, reply) => {
    const ok = deleteWordCard(req.params.id)
    return ok ? { ok: true } : reply.status(404).send({ error: 'Not found or built-in card' })
  })

  const wss = new WebSocketServer({ noServer: true })
  wss.on('connection', handleConnection)

  await app.listen({ port: PORT, host: '0.0.0.0' })

  app.server.on('upgrade', (req, socket, head) => {
    if (req.url === '/ws') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req)
      })
    } else {
      socket.destroy()
    }
  })
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
