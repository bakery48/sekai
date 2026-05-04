import { create } from 'zustand'
import type { RoomState, TopicCard, WordCard, ClientSubmission, ServerMessage } from '@sekai/shared'

type Screen = 'lobby' | 'waiting' | 'game' | 'result'

type GameStore = {
  // 接続状態
  connected: boolean
  setConnected: (v: boolean) => void

  // 自分の情報
  playerId: string | null
  roomId: string | null
  hand: WordCard[]

  // ゲーム状態
  screen: Screen
  roomState: RoomState | null
  currentTopic: TopicCard | null
  selectedCardIds: string[]
  submissions: ClientSubmission[]
  lastWinnerId: string | 'dummy' | null
  lastWinnerSubmissionIndex: number | null
  gameOverWinnerId: string | null
  errorMessage: string | null
  allDiscardReady: boolean

  // アクション
  selectCard: (id: string) => void
  clearSelection: () => void
  setError: (msg: string | null) => void
  handleMessage: (msg: ServerMessage) => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  connected: false,
  setConnected: (connected) => set({ connected }),

  playerId: null,
  roomId: null,
  hand: [],

  screen: 'lobby',
  roomState: null,
  currentTopic: null,
  selectedCardIds: [],
  submissions: [],
  lastWinnerId: null,
  lastWinnerSubmissionIndex: null,
  gameOverWinnerId: null,
  errorMessage: null,
  allDiscardReady: false,

  selectCard: (id) => {
    const { selectedCardIds, currentTopic } = get()
    const blanks = 1
    if (selectedCardIds.includes(id)) {
      set({ selectedCardIds: selectedCardIds.filter((c) => c !== id) })
    } else if (selectedCardIds.length < blanks) {
      set({ selectedCardIds: [...selectedCardIds, id] })
    }
  },

  clearSelection: () => set({ selectedCardIds: [] }),

  setError: (errorMessage) => set({ errorMessage }),

  handleMessage: (msg) => {
    switch (msg.type) {
      case 'room_created':
        set({
          playerId: extractPlayerId(msg.state, msg.yourHand),
          roomId: msg.roomId,
          roomState: msg.state,
          hand: msg.yourHand,
          screen: 'waiting',
          errorMessage: null,
        })
        break

      case 'room_state':
        set((s) => ({
          roomState: msg.state,
          hand: msg.yourHand,
          playerId: msg.playerId ?? s.playerId,
          roomId: msg.state.roomId,
          screen: msg.state.phase === 'waiting' ? 'waiting' : 'game',
          submissions: msg.state.submissions.length > 0 ? msg.state.submissions : s.submissions,
          currentTopic: msg.state.currentTopicCard ?? s.currentTopic,
          errorMessage: null,
        }))
        break

      case 'player_joined':
        set((s) => {
          if (!s.roomState) return {}
          return {
            roomState: {
              ...s.roomState,
              players: [
                ...s.roomState.players,
                { id: msg.playerId, name: msg.playerName, score: 0, isConnected: true, isHost: false },
              ],
            },
          }
        })
        break

      case 'player_left':
        set((s) => {
          if (!s.roomState) return {}
          return {
            roomState: {
              ...s.roomState,
              players: s.roomState.players.map((p) =>
                p.id === msg.playerId ? { ...p, isConnected: false } : p
              ),
            },
          }
        })
        break

      case 'game_started':
        set({
          roomState: msg.state,
          hand: msg.yourHand,
          screen: 'game',
          selectedCardIds: [],
          submissions: [],
          lastWinnerId: null,
          gameOverWinnerId: null,
        })
        break

      case 'topic_revealed':
        set({
          currentTopic: msg.topicCard,
          submissions: [],
          selectedCardIds: [],
          lastWinnerId: null,
          lastWinnerSubmissionIndex: null,
          allDiscardReady: false,
        })
        set((s) => ({
          roomState: s.roomState
            ? { ...s.roomState, phase: 'topic_revealed', submissions: [] }
            : s.roomState,
        }))
        break

      case 'player_submitted':
        break

      case 'card_revealed':
        set((s) => ({
          submissions: s.submissions.map((sub, i) =>
            i === msg.submissionIndex ? { ...sub, isRevealed: true } : sub
          ),
          roomState: s.roomState
            ? {
                ...s.roomState,
                submissions: s.roomState.submissions.map((sub, i) =>
                  i === msg.submissionIndex ? { ...sub, isRevealed: true } : sub
                ),
              }
            : s.roomState,
        }))
        break

      case 'all_submitted':
        set({ submissions: msg.submissions })
        set((s) => ({
          roomState: s.roomState ? { ...s.roomState, phase: 'judging', submissions: msg.submissions } : s.roomState,
        }))
        break

      case 'winner_selected':
        set({
          lastWinnerId: msg.winnerId,
          lastWinnerSubmissionIndex: msg.submissionIndex,
        })
        set((s) => ({
          roomState: s.roomState
            ? {
                ...s.roomState,
                phase: 'round_result',
                players: s.roomState.players.map((p) => ({
                  ...p,
                  score: msg.updatedScores[p.id] ?? p.score,
                })),
              }
            : s.roomState,
        }))
        break

      case 'game_over':
        set({
          gameOverWinnerId: msg.winnerId,
          screen: 'result',
        })
        set((s) => ({
          roomState: s.roomState
            ? {
                ...s.roomState,
                phase: 'game_over',
                players: s.roomState.players.map((p) => ({
                  ...p,
                  score: msg.finalScores[p.id] ?? p.score,
                })),
              }
            : s.roomState,
        }))
        break

      case 'all_discard_ready':
        set({ allDiscardReady: true })
        break

      case 'hand_updated':
        set({ hand: msg.hand })
        break

      case 'error':
        set({ errorMessage: msg.message })
        break
    }
  },
}))

function extractPlayerId(state: RoomState, hand: WordCard[]): string | null {
  // hand の所有者は最後に追加されたプレイヤー（= 自分）
  if (hand.length === 0) return state.players[0]?.id ?? null
  return state.players[state.players.length - 1]?.id ?? null
}
