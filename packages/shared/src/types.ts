export type TopicCard = {
  id: string
  frontText: string
  backText: string
  blanks: 1 | 2
}

export type WordCard = {
  id: string
  text: string
}

export type Player = {
  id: string
  name: string
  hand: WordCard[]
  score: number
  isConnected: boolean
  isHost: boolean
}

export type GamePhase =
  | 'waiting'
  | 'topic_revealed'
  | 'judging'
  | 'round_result'
  | 'game_over'

export type Submission = {
  playerId: string | 'dummy'
  cards: WordCard[]
  isRevealed: boolean
}

export type ClientSubmission = {
  submissionIndex: number
  cards: WordCard[]
  isRevealed: boolean
}

export type RoomState = {
  roomId: string
  phase: GamePhase
  players: Omit<Player, 'hand'>[]
  currentJudgeIndex: number
  currentTopicCard: TopicCard | null
  submissions: ClientSubmission[]
  roundNumber: number
  winThreshold: number
}

export const WIN_THRESHOLD: Record<number, number> = {
  2: 10,
  3: 8,
  4: 7,
  5: 6,
  6: 5,
  7: 4,
  8: 4,
  9: 4,
}
