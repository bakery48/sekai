import WebSocket from 'ws'
import type { ClientMessage } from '@sekai/shared'
import { gameManager } from './gameManager'
import type { GameRoom } from './gameRoom'

const playerIdByWs = new WeakMap<WebSocket, string>()

export function handleConnection(ws: WebSocket): void {
  ws.on('message', (raw) => {
    let msg: ClientMessage
    try {
      msg = JSON.parse(raw.toString()) as ClientMessage
    } catch {
      send(ws, { type: 'error', message: 'Invalid JSON' })
      return
    }
    handleMessage(ws, msg)
  })

  ws.on('close', () => {
    const playerId = playerIdByWs.get(ws)
    if (!playerId) return

    const room = gameManager.getRoomByPlayer(playerId)
    if (room) {
      const phaseChanged = room.removePlayer(playerId)
      room.broadcast({ type: 'player_left', playerId }, playerId)
      if (phaseChanged) {
        const state = room.getRoomState()
        room.broadcast({ type: 'all_submitted', submissions: state.submissions })
      }
    }
    gameManager.disconnectPlayer(playerId)
    gameManager.cleanupEmptyRooms()
  })
}

function handleMessage(ws: WebSocket, msg: ClientMessage): void {
  switch (msg.type) {
    case 'create_room': {
      const { roomId, playerId } = gameManager.createRoom(ws, msg.playerName, msg.winThreshold)
      playerIdByWs.set(ws, playerId)
      const room = gameManager.getRoom(roomId)!
      const player = room.getPlayer(playerId)!
      send(ws, {
        type: 'room_created',
        roomId,
        state: room.getRoomState(),
        yourHand: player.hand,
      })
      break
    }

    case 'join_room': {
      const result = gameManager.joinRoom(ws, msg.playerName, msg.roomId)
      if (!result.ok) {
        send(ws, { type: 'error', message: result.error! })
        return
      }
      const playerId = result.playerId!
      playerIdByWs.set(ws, playerId)

      const room = gameManager.getRoom(msg.roomId)!
      const player = room.getPlayer(playerId)!
      send(ws, {
        type: 'room_state',
        state: room.getRoomState(),
        yourHand: player.hand,
        playerId,
      })
      room.broadcast({ type: 'player_joined', playerId, playerName: msg.playerName }, playerId)
      break
    }

    case 'start_game': {
      const playerId = playerIdByWs.get(ws)
      if (!playerId) return

      const room = gameManager.getRoom(msg.roomId)
      if (!room) { send(ws, { type: 'error', message: 'Room not found' }); return }

      const player = room.getPlayer(playerId)
      if (!player?.isHost) { send(ws, { type: 'error', message: 'Only host can start' }); return }
      if (room.playerCount < 2) { send(ws, { type: 'error', message: 'Need at least 2 players' }); return }

      room.startGame()
      const state = room.getRoomState()
      const topic = room.currentTopic

      for (const p of room.allPlayers) {
        if (p.ws.readyState === WebSocket.OPEN) {
          p.ws.send(JSON.stringify({ type: 'game_started', state, yourHand: p.hand }))
          p.ws.send(JSON.stringify({ type: 'topic_revealed', topicCard: topic }))
        }
      }
      break
    }

    case 'submit_answer': {
      const playerId = playerIdByWs.get(ws)
      if (!playerId) return

      const room = gameManager.getRoom(msg.roomId)
      if (!room) { send(ws, { type: 'error', message: 'Room not found' }); return }

      const result = room.submitAnswer(playerId, msg.cardIds)
      if (!result.ok) { send(ws, { type: 'error', message: result.error! }); return }

      room.broadcast({ type: 'player_submitted', playerId })

      if (room.isAllSubmitted()) {
        const state = room.getRoomState()
        room.broadcast({ type: 'all_submitted', submissions: state.submissions })
        // Also send per-player room_state so clients sync phase even if all_submitted is dropped
        for (const p of room.allPlayers) {
          if (p.ws.readyState === WebSocket.OPEN) {
            p.ws.send(JSON.stringify({ type: 'room_state', state, yourHand: p.hand }))
          }
        }
      }
      break
    }

    case 'reveal_card': {
      const playerId = playerIdByWs.get(ws)
      if (!playerId) return

      const room = gameManager.getRoom(msg.roomId)
      if (!room) { send(ws, { type: 'error', message: 'Room not found' }); return }

      const result = room.revealCard(playerId, msg.submissionIndex)
      if (!result.ok) { send(ws, { type: 'error', message: result.error! }); return }

      room.broadcast({ type: 'card_revealed', submissionIndex: msg.submissionIndex })
      break
    }

    case 'select_winner': {
      const playerId = playerIdByWs.get(ws)
      if (!playerId) return

      const room = gameManager.getRoom(msg.roomId)
      if (!room) { send(ws, { type: 'error', message: 'Room not found' }); return }

      const result = room.selectWinner(playerId, msg.submissionIndex)
      if (!result.ok) { send(ws, { type: 'error', message: result.error! }); return }

      room.broadcast({
        type: 'winner_selected',
        submissionIndex: msg.submissionIndex,
        winnerId: result.isDummy ? 'dummy' : result.winnerId!,
        isDummy: result.isDummy,
        updatedScores: result.updatedScores,
      })

      const winner = room.checkWinCondition()
      if (winner) {
        room.broadcast({
          type: 'game_over',
          winnerId: winner,
          finalScores: result.updatedScores,
        })
      } else {
        room.scheduleAutoNextRound(() => advanceToNextRound(room), 10000)
      }
      break
    }

    case 'discard_cards': {
      const playerId = playerIdByWs.get(ws)
      if (!playerId) return

      const room = gameManager.getRoom(msg.roomId)
      if (!room) { send(ws, { type: 'error', message: 'Room not found' }); return }

      const result = room.discardCards(playerId, msg.cardIds)
      if (!result.ok) { send(ws, { type: 'error', message: result.error! }); return }

      send(ws, { type: 'hand_updated', hand: result.hand })
      if (room.isAllDiscardReady()) {
        advanceToNextRound(room)
      }
      break
    }

    default: {
      send(ws, { type: 'error', message: 'Unknown message type' })
    }
  }
}

function send(ws: WebSocket, msg: object): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

function advanceToNextRound(room: GameRoom): void {
  room.cancelAutoNextRound()
  room.nextRound()
  const state = room.getRoomState()
  const topic = room.currentTopic
  for (const p of room.allPlayers) {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(JSON.stringify({ type: 'room_state', state, yourHand: p.hand }))
      p.ws.send(JSON.stringify({ type: 'topic_revealed', topicCard: topic }))
    }
  }
}
