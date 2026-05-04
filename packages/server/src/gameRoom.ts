import type {
  Player, TopicCard, WordCard, GamePhase,
  RoomState, ClientSubmission, ServerMessage, WIN_THRESHOLD,
} from '@sekai/shared'
import { WIN_THRESHOLD as WIN_THRESHOLD_MAP } from '@sekai/shared'
import { TopicDeck, WordDeck, shuffle } from './deck'
import WebSocket from 'ws'

const HAND_SIZE = 7

type InternalSubmission = {
  playerId: string | 'dummy'
  cards: WordCard[]
  isRevealed: boolean
}

export type ConnectedPlayer = Player & { ws: WebSocket }

export class GameRoom {
  readonly roomId: string
  private players: ConnectedPlayer[] = []
  private phase: GamePhase = 'waiting'
  private currentJudgeIndex = 0
  private currentTopicCard: TopicCard | null = null
  private currentTopicText = ''
  private currentBlanks: 1 | 2 = 1
  private submissions: InternalSubmission[] = []
  private submittedPlayerIds = new Set<string>()
  private roundNumber = 0
  private topicDeck: TopicDeck | null = null
  private wordDeck: WordDeck | null = null

  constructor(roomId: string) {
    this.roomId = roomId
  }

  get winThreshold(): number {
    const n = this.players.length
    return WIN_THRESHOLD_MAP[n] ?? 4
  }

  get playerCount() {
    return this.players.length
  }

  addPlayer(ws: WebSocket, playerId: string, name: string): ConnectedPlayer {
    const isHost = this.players.length === 0
    const player: ConnectedPlayer = {
      id: playerId,
      name,
      hand: [],
      score: 0,
      isConnected: true,
      isHost,
      ws,
    }
    this.players.push(player)
    return player
  }

  removePlayer(playerId: string): boolean {
    const p = this.players.find(p => p.id === playerId)
    if (!p) return false
    p.isConnected = false

    // 回答フェーズ中に切断した場合、全員提出済み判定を再チェック
    if (this.phase === 'topic_revealed') {
      const judge = this.players[this.currentJudgeIndex]
      const activePlayers = this.players.filter(p => p.isConnected && p.id !== judge?.id)
      if (activePlayers.length > 0 && this.submittedPlayerIds.size >= activePlayers.length) {
        this.insertDummyAndShuffle()
        this.phase = 'judging'
        return true // 呼び出し元でall_submittedを送信させる
      }
    }
    return false
  }

  getPlayer(playerId: string) {
    return this.players.find(p => p.id === playerId) ?? null
  }

  startGame(): void {
    this.topicDeck = new TopicDeck()
    this.wordDeck = new WordDeck()
    this.phase = 'waiting'
    this.currentJudgeIndex = 0
    this.roundNumber = 0

    for (const p of this.players) {
      p.hand = this.wordDeck.draw(HAND_SIZE)
      p.score = 0
    }

    this.startRound()
  }

  private startRound(): void {
    const drawn = this.topicDeck!.draw()
    if (!drawn) {
      this.phase = 'game_over'
      return
    }
    this.currentTopicCard = drawn.card
    this.currentTopicText = drawn.text
    this.currentBlanks = drawn.blanks
    this.submissions = []
    this.submittedPlayerIds.clear()
    this.roundNumber++
    this.phase = 'topic_revealed'
  }

  submitAnswer(playerId: string, cardIds: string[]): { ok: boolean; error?: string } {
    if (this.phase !== 'topic_revealed') return { ok: false, error: 'Not in answering phase' }
    const judge = this.players[this.currentJudgeIndex]
    if (playerId === judge.id) return { ok: false, error: 'Judge cannot submit' }
    if (this.submittedPlayerIds.has(playerId)) return { ok: false, error: 'Already submitted' }

    const player = this.getPlayer(playerId)
    if (!player) return { ok: false, error: 'Player not found' }
    if (cardIds.length !== this.currentBlanks) {
      return { ok: false, error: `Must submit exactly ${this.currentBlanks} card(s)` }
    }

    const selected = cardIds.map(id => player.hand.find(c => c.id === id)).filter(Boolean) as WordCard[]
    if (selected.length !== cardIds.length) return { ok: false, error: 'Invalid card IDs' }

    player.hand = player.hand.filter(c => !cardIds.includes(c.id))
    this.submissions.push({ playerId, cards: selected, isRevealed: false })
    this.submittedPlayerIds.add(playerId)

    const activePlayers = this.players.filter(p => p.isConnected && p.id !== judge.id)
    if (this.submittedPlayerIds.size >= activePlayers.length) {
      this.insertDummyAndShuffle()
      this.phase = 'judging'
    }

    return { ok: true }
  }

  private insertDummyAndShuffle(): void {
    const dummyCards = this.wordDeck!.draw(this.currentBlanks)
    if (dummyCards.length > 0) {
      this.submissions.push({ playerId: 'dummy', cards: dummyCards, isRevealed: false })
    }
    this.submissions = shuffle(this.submissions)
  }

  revealCard(judgeId: string, submissionIndex: number): { ok: boolean; error?: string } {
    if (this.phase !== 'judging') return { ok: false, error: 'Not in judging phase' }
    const judge = this.players[this.currentJudgeIndex]
    if (judgeId !== judge.id) return { ok: false, error: 'Not the judge' }
    const submission = this.submissions[submissionIndex]
    if (!submission) return { ok: false, error: 'Invalid submission index' }
    submission.isRevealed = true
    return { ok: true }
  }

  areAllRevealed(): boolean {
    return this.submissions.length > 0 && this.submissions.every(s => s.isRevealed)
  }

  selectWinner(judgeId: string, submissionIndex: number): {
    ok: boolean
    error?: string
    isDummy: boolean
    winnerId: string | null
    updatedScores: Record<string, number>
  } {
    if (this.phase !== 'judging') return { ok: false, error: 'Not in judging phase', isDummy: false, winnerId: null, updatedScores: {} }
    const judge = this.players[this.currentJudgeIndex]
    if (judgeId !== judge.id) return { ok: false, error: 'Not the judge', isDummy: false, winnerId: null, updatedScores: {} }

    const submission = this.submissions[submissionIndex]
    if (!submission) return { ok: false, error: 'Invalid submission index', isDummy: false, winnerId: null, updatedScores: {} }

    submission.isRevealed = true
    const isDummy = submission.playerId === 'dummy'

    if (isDummy) {
      judge.score = Math.max(0, judge.score - 1)
    } else {
      const winner = this.getPlayer(submission.playerId as string)
      if (winner) winner.score++
    }

    const updatedScores: Record<string, number> = {}
    for (const p of this.players) updatedScores[p.id] = p.score

    this.phase = 'round_result'
    return { ok: true, isDummy, winnerId: isDummy ? null : (submission.playerId as string), updatedScores }
  }

  checkWinCondition(): string | null {
    for (const p of this.players) {
      if (p.score >= this.winThreshold) return p.id
    }
    return null
  }

  nextRound(): void {
    const judge = this.players[this.currentJudgeIndex]
    for (const p of this.players) {
      const needed = HAND_SIZE - p.hand.length
      if (needed > 0 && p.id !== judge.id) {
        p.hand.push(...this.wordDeck!.draw(needed))
      }
    }
    this.currentJudgeIndex = (this.currentJudgeIndex + 1) % this.players.length
    this.startRound()
  }

  getRoomState(): RoomState {
    return {
      roomId: this.roomId,
      phase: this.phase,
      players: this.players.map(({ ws: _ws, hand: _hand, ...rest }) => rest),
      currentJudgeIndex: this.currentJudgeIndex,
      currentTopicCard: this.currentTopicCard
        ? { ...this.currentTopicCard, frontText: this.currentTopicText, backText: this.currentTopicText }
        : null,
      submissions: this.submissions.map((s, i) => ({
        submissionIndex: i,
        cards: s.cards,
        isRevealed: s.isRevealed,
      })),
      roundNumber: this.roundNumber,
      winThreshold: this.winThreshold,
    }
  }

  broadcast(msg: ServerMessage, excludeId?: string): void {
    const data = JSON.stringify(msg)
    for (const p of this.players) {
      if (p.id === excludeId) continue
      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(data)
      }
    }
  }

  send(playerId: string, msg: ServerMessage): void {
    const p = this.getPlayer(playerId)
    if (p && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(JSON.stringify(msg))
    }
  }

  get currentTopic() {
    return {
      card: this.currentTopicCard,
      text: this.currentTopicText,
      blanks: this.currentBlanks,
    }
  }

  get judgeId() {
    return this.players[this.currentJudgeIndex]?.id ?? null
  }

  get allPlayers() {
    return this.players
  }

  get allSubmissionsCount() {
    return this.submittedPlayerIds.size
  }

  isAllSubmitted(): boolean {
    const judge = this.players[this.currentJudgeIndex]
    const activePlayers = this.players.filter(p => p.isConnected && p.id !== judge?.id)
    return this.submittedPlayerIds.size >= activePlayers.length
  }
}
