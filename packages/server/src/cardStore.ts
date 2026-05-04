import fs from 'fs'
import path from 'path'
import type { TopicCard, WordCard } from '@sekai/shared'

const STORE_PATH = path.join(__dirname, '../customCards.json')

type CardStore = {
  topicCards: TopicCard[]
  wordCards: WordCard[]
}

function load(): CardStore {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'))
  } catch {
    return { topicCards: [], wordCards: [] }
  }
}

function save(store: CardStore): void {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8')
}

export function getCustomCards(): CardStore {
  return load()
}

export function addTopicCard(card: TopicCard): void {
  const store = load()
  store.topicCards.push(card)
  save(store)
}

export function addWordCard(card: WordCard): void {
  const store = load()
  store.wordCards.push(card)
  save(store)
}

export function deleteTopicCard(id: string): boolean {
  const store = load()
  const before = store.topicCards.length
  store.topicCards = store.topicCards.filter(c => c.id !== id)
  if (store.topicCards.length < before) { save(store); return true }
  return false
}

export function deleteWordCard(id: string): boolean {
  const store = load()
  const before = store.wordCards.length
  store.wordCards = store.wordCards.filter(c => c.id !== id)
  if (store.wordCards.length < before) { save(store); return true }
  return false
}
