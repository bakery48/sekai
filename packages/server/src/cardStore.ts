import fs from 'fs'
import path from 'path'
import type { TopicCard, WordCard } from '@sekai/shared'

const STORE_PATH = path.join(__dirname, '../customCards.json')

type CardStore = {
  topicCards: TopicCard[]
  wordCards: WordCard[]
  disabledTopicIds: string[]
  disabledWordIds: string[]
}

function load(): CardStore {
  try {
    const data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'))
    return {
      topicCards: data.topicCards ?? [],
      wordCards: data.wordCards ?? [],
      disabledTopicIds: data.disabledTopicIds ?? [],
      disabledWordIds: data.disabledWordIds ?? [],
    }
  } catch {
    return { topicCards: [], wordCards: [], disabledTopicIds: [], disabledWordIds: [] }
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
  store.disabledTopicIds = store.disabledTopicIds.filter(i => i !== id)
  if (store.topicCards.length < before) { save(store); return true }
  return false
}

export function deleteWordCard(id: string): boolean {
  const store = load()
  const before = store.wordCards.length
  store.wordCards = store.wordCards.filter(c => c.id !== id)
  store.disabledWordIds = store.disabledWordIds.filter(i => i !== id)
  if (store.wordCards.length < before) { save(store); return true }
  return false
}

export function setTopicEnabled(id: string, enabled: boolean): void {
  const store = load()
  if (enabled) {
    store.disabledTopicIds = store.disabledTopicIds.filter(i => i !== id)
  } else {
    if (!store.disabledTopicIds.includes(id)) store.disabledTopicIds.push(id)
  }
  save(store)
}

export function setWordEnabled(id: string, enabled: boolean): void {
  const store = load()
  if (enabled) {
    store.disabledWordIds = store.disabledWordIds.filter(i => i !== id)
  } else {
    if (!store.disabledWordIds.includes(id)) store.disabledWordIds.push(id)
  }
  save(store)
}
