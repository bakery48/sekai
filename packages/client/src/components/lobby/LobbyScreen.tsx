import { useState } from 'react'
import type { ClientMessage } from '@sekai/shared'

type Props = {
  send: (msg: ClientMessage) => void
  connected: boolean
  errorMessage: string | null
  onAdmin: () => void
}

export default function LobbyScreen({ send, connected, errorMessage, onAdmin }: Props) {
  const [mode, setMode] = useState<'top' | 'create' | 'join'>('top')
  const [playerName, setPlayerName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [winThreshold, setWinThreshold] = useState(3)
  const [mulliganSeconds, setMulliganSeconds] = useState(30)

  const handleCreate = () => {
    if (!playerName.trim()) return
    send({ type: 'create_room', playerName: playerName.trim(), winThreshold, mulliganSeconds })
  }

  const handleJoin = () => {
    if (!playerName.trim() || roomId.trim().length !== 4) return
    send({ type: 'join_room', playerName: playerName.trim(), roomId: roomId.trim() })
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-amber-900 mb-2 text-center">私の世界の見方</h1>
      <p className="text-amber-700 mb-8 text-center text-sm">2〜9人で遊べる大喜利カードゲーム</p>

      {!connected && (
        <p className="text-red-500 mb-4 text-sm">サーバーに接続中...</p>
      )}
      {errorMessage && (
        <p className="text-red-500 mb-4 text-sm bg-red-50 px-4 py-2 rounded-lg">{errorMessage}</p>
      )}

      {mode === 'top' && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => setMode('create')}
            disabled={!connected}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl text-lg transition-colors"
          >
            ルームを作る
          </button>
          <button
            onClick={() => setMode('join')}
            disabled={!connected}
            className="bg-white hover:bg-amber-100 disabled:opacity-50 text-amber-700 font-bold py-3 px-6 rounded-xl text-lg border-2 border-amber-400 transition-colors"
          >
            ルームに参加
          </button>
          <button
            onClick={onAdmin}
            className="text-amber-600 hover:text-amber-800 text-sm py-2 transition-colors"
          >
            カード管理
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="bg-white rounded-2xl p-6 shadow-md w-full max-w-xs flex flex-col gap-4">
          <h2 className="text-xl font-bold text-amber-900">ルームを作る</h2>
          <input
            type="text"
            placeholder="あなたの名前"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            maxLength={12}
            className="border-2 border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
          />
          <div>
            <p className="text-sm text-gray-600 mb-2">先取ポイント</p>
            <div className="flex gap-2">
              {[3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setWinThreshold(n)}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 transition-colors ${winThreshold === n ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-amber-200 text-amber-700 hover:border-amber-400'}`}
                >
                  {n}点
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">マリガン時間</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={10}
                max={99}
                value={mulliganSeconds}
                onChange={(e) => {
                  const v = Math.min(99, Math.max(10, Number(e.target.value)))
                  setMulliganSeconds(v)
                }}
                className="w-20 border-2 border-amber-200 rounded-lg px-3 py-2 text-center font-bold focus:outline-none focus:border-amber-400"
              />
              <span className="text-sm text-gray-600">秒</span>
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={!playerName.trim()}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition-colors"
          >
            作成
          </button>
          <button onClick={() => setMode('top')} className="text-amber-600 text-sm hover:underline">
            戻る
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="bg-white rounded-2xl p-6 shadow-md w-full max-w-xs flex flex-col gap-4">
          <h2 className="text-xl font-bold text-amber-900">ルームに参加</h2>
          <input
            type="text"
            placeholder="あなたの名前"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={12}
            className="border-2 border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="4桁の番号"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            maxLength={4}
            className="border-2 border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400 tracking-widest font-mono text-center text-2xl"
          />
          <button
            onClick={handleJoin}
            disabled={!playerName.trim() || roomId.trim().length !== 4}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition-colors"
          >
            参加
          </button>
          <button onClick={() => setMode('top')} className="text-amber-600 text-sm hover:underline">
            戻る
          </button>
        </div>
      )}
    </div>
  )
}
