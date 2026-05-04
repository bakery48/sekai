import { GameRoom } from './gameRoom'
import WebSocket from 'ws'

const ROOM_ID_LENGTH = 6

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 2 + ROOM_ID_LENGTH).toUpperCase()
}

function generatePlayerId(): string {
  return Math.random().toString(36).substring(2, 12)
}

export class GameManager {
  private rooms = new Map<string, GameRoom>()
  private playerRoomMap = new Map<string, string>()

  createRoom(ws: WebSocket, playerName: string): { roomId: string; playerId: string } {
    let roomId = generateRoomId()
    while (this.rooms.has(roomId)) roomId = generateRoomId()

    const room = new GameRoom(roomId)
    this.rooms.set(roomId, room)

    const playerId = generatePlayerId()
    room.addPlayer(ws, playerId, playerName)
    this.playerRoomMap.set(playerId, roomId)

    return { roomId, playerId }
  }

  joinRoom(
    ws: WebSocket,
    playerName: string,
    roomId: string,
  ): { ok: boolean; playerId?: string; error?: string } {
    const room = this.rooms.get(roomId)
    if (!room) return { ok: false, error: 'Room not found' }
    if (room.playerCount >= 9) return { ok: false, error: 'Room is full' }

    const playerId = generatePlayerId()
    room.addPlayer(ws, playerId, playerName)
    this.playerRoomMap.set(playerId, roomId)

    return { ok: true, playerId }
  }

  getRoom(roomId: string): GameRoom | null {
    return this.rooms.get(roomId) ?? null
  }

  getRoomByPlayer(playerId: string): GameRoom | null {
    const roomId = this.playerRoomMap.get(playerId)
    if (!roomId) return null
    return this.rooms.get(roomId) ?? null
  }

  disconnectPlayer(playerId: string): void {
    const room = this.getRoomByPlayer(playerId)
    if (room) {
      room.removePlayer(playerId)
      this.playerRoomMap.delete(playerId)
    }
  }

  cleanupEmptyRooms(): void {
    for (const [id, room] of this.rooms) {
      if (room.allPlayers.filter(p => p.isConnected).length === 0) {
        this.rooms.delete(id)
      }
    }
  }
}

export const gameManager = new GameManager()
