import type { TopicCard, WordCard } from '@sekai/shared'
import { topicCards } from './data/topicCards'
import { wordCards } from './data/wordCards'

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export class TopicDeck {
  private cards: TopicCard[]
  private useFront: boolean[]

  constructor() {
    this.cards = shuffle(topicCards)
    this.useFront = this.cards.map(() => Math.random() < 0.5)
  }

  draw(): { card: TopicCard; text: string; blanks: 1 | 2 } | null {
    const card = this.cards.shift()
    const front = this.useFront.shift() ?? true
    if (!card) return null
    return {
      card,
      text: front ? card.frontText : card.backText,
      blanks: card.blanks,
    }
  }

  get remaining() {
    return this.cards.length
  }
}

export class WordDeck {
  private cards: WordCard[]

  constructor() {
    this.cards = shuffle(wordCards)
  }

  draw(count: number): WordCard[] {
    return this.cards.splice(0, count)
  }

  drawOne(): WordCard | null {
    return this.cards.shift() ?? null
  }

  get remaining() {
    return this.cards.length
  }
}
