import { useEffect, useRef, useCallback } from 'react'
import type { ClientMessage, ServerMessage } from '@sekai/shared'
import { useGameStore } from '../store/gameStore'

const WS_URL = import.meta.env.DEV ? 'ws://localhost:3000/ws' : `ws://${location.host}/ws`

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null)
  const handleMessage = useGameStore((s) => s.handleMessage)
  const setConnected = useGameStore((s) => s.setConnected)

  useEffect(() => {
    const socket = new WebSocket(WS_URL)
    ws.current = socket

    socket.onopen = () => setConnected(true)
    socket.onclose = () => setConnected(false)
    socket.onerror = () => setConnected(false)
    socket.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as ServerMessage
        handleMessage(msg)
      } catch {
        console.error('Failed to parse message', e.data)
      }
    }

    return () => {
      socket.close()
      ws.current = null
    }
  }, [handleMessage, setConnected])

  const send = useCallback((msg: ClientMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg))
    }
  }, [])

  return { send }
}
