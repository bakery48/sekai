import type { TopicCard, WordCard, RoomState, ClientSubmission } from './types'

// ===== クライアント → サーバー =====
export type C2S_CreateRoom   = { type: 'create_room'; playerName: string; winThreshold: number }
export type C2S_JoinRoom     = { type: 'join_room'; playerName: string; roomId: string }
export type C2S_StartGame    = { type: 'start_game'; roomId: string }
export type C2S_SubmitAnswer = { type: 'submit_answer'; roomId: string; cardIds: string[] }
export type C2S_RevealCard   = { type: 'reveal_card'; roomId: string; submissionIndex: number }
export type C2S_SelectWinner = { type: 'select_winner'; roomId: string; submissionIndex: number }
export type C2S_DiscardCards = { type: 'discard_cards'; roomId: string; cardIds: string[] }
export type C2S_NextRound    = { type: 'next_round'; roomId: string }

export type ClientMessage =
  | C2S_CreateRoom
  | C2S_JoinRoom
  | C2S_StartGame
  | C2S_SubmitAnswer
  | C2S_RevealCard
  | C2S_SelectWinner
  | C2S_DiscardCards
  | C2S_NextRound

// ===== サーバー → クライアント =====
export type S2C_RoomCreated     = { type: 'room_created'; roomId: string; state: RoomState; yourHand: WordCard[] }
export type S2C_RoomState       = { type: 'room_state'; state: RoomState; yourHand: WordCard[]; playerId?: string }
export type S2C_PlayerJoined    = { type: 'player_joined'; playerName: string; playerId: string }
export type S2C_PlayerLeft      = { type: 'player_left'; playerId: string }
export type S2C_GameStarted     = { type: 'game_started'; state: RoomState; yourHand: WordCard[] }
export type S2C_TopicRevealed   = { type: 'topic_revealed'; topicCard: TopicCard }
export type S2C_PlayerSubmitted = { type: 'player_submitted'; playerId: string }
export type S2C_AllSubmitted    = { type: 'all_submitted'; submissions: ClientSubmission[] }
export type S2C_CardRevealed    = { type: 'card_revealed'; submissionIndex: number }
export type S2C_WinnerSelected  = {
  type: 'winner_selected'
  submissionIndex: number
  winnerId: string | 'dummy'
  isDummy: boolean
  updatedScores: Record<string, number>
}
export type S2C_HandUpdated     = { type: 'hand_updated'; hand: WordCard[] }
export type S2C_AllDiscardReady = { type: 'all_discard_ready' }
export type S2C_GameOver        = { type: 'game_over'; winnerId: string; finalScores: Record<string, number> }
export type S2C_Error           = { type: 'error'; message: string }

export type ServerMessage =
  | S2C_RoomCreated
  | S2C_RoomState
  | S2C_PlayerJoined
  | S2C_PlayerLeft
  | S2C_GameStarted
  | S2C_TopicRevealed
  | S2C_PlayerSubmitted
  | S2C_AllSubmitted
  | S2C_CardRevealed
  | S2C_WinnerSelected
  | S2C_HandUpdated
  | S2C_AllDiscardReady
  | S2C_GameOver
  | S2C_Error
