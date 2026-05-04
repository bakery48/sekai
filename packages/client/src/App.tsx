import { useState } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { useGameStore } from './store/gameStore'
import LobbyScreen from './components/lobby/LobbyScreen'
import WaitingScreen from './components/lobby/WaitingScreen'
import GameScreen from './components/game/GameScreen'
import ResultScreen from './components/game/ResultScreen'
import AdminScreen from './components/admin/AdminScreen'

export default function App() {
  const { send } = useWebSocket()
  const { screen, connected, roomState, playerId, errorMessage, gameOverWinnerId } = useGameStore()
  const [showAdmin, setShowAdmin] = useState(false)

  if (showAdmin) {
    return <AdminScreen onBack={() => setShowAdmin(false)} />
  }

  if (screen === 'lobby') {
    return <LobbyScreen send={send} connected={connected} errorMessage={errorMessage} onAdmin={() => setShowAdmin(true)} />
  }

  if (screen === 'waiting' && roomState && playerId) {
    return <WaitingScreen roomState={roomState} playerId={playerId} send={send} errorMessage={errorMessage} />
  }

  if (screen === 'result' && roomState && playerId) {
    return <ResultScreen roomState={roomState} playerId={playerId} gameOverWinnerId={gameOverWinnerId} />
  }

  if (screen === 'game') {
    return <GameScreen send={send} />
  }

  return null
}
