import type { RoomState, ClientMessage } from '@sekai/shared'

type Props = {
  roomState: RoomState
  playerId: string
  send: (msg: ClientMessage) => void
  errorMessage: string | null
}

export default function WaitingScreen({ roomState, playerId, send, errorMessage }: Props) {
  const me = roomState.players.find((p) => p.id === playerId)
  const isHost = me?.isHost ?? false

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-amber-900 mb-1">参加待ち</h1>
      <div className="bg-white rounded-2xl px-6 py-3 mb-6 shadow">
        <p className="text-sm text-amber-600">ルームID</p>
        <p className="text-3xl font-mono font-bold text-amber-900 tracking-widest">{roomState.roomId}</p>
        <p className="text-xs text-amber-500 mt-1">このIDを友達に教えよう</p>
      </div>

      {errorMessage && (
        <p className="text-red-500 mb-4 text-sm bg-red-50 px-4 py-2 rounded-lg">{errorMessage}</p>
      )}

      <div className="bg-white rounded-2xl p-4 shadow w-full max-w-sm mb-6">
        <p className="text-sm font-bold text-amber-700 mb-3">参加中のプレイヤー ({roomState.players.length}人)</p>
        <ul className="flex flex-col gap-2">
          {roomState.players.map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              <span className="text-lg">{p.id === playerId ? '👤' : '🙂'}</span>
              <span className="font-medium text-gray-800">{p.name}</span>
              {p.isHost && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">ホスト</span>}
              {p.id === playerId && <span className="text-xs text-gray-400">(あなた)</span>}
            </li>
          ))}
        </ul>
      </div>

      {isHost ? (
        <button
          onClick={() => send({ type: 'start_game', roomId: roomState.roomId })}
          disabled={roomState.players.length < 2}
          className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl text-lg transition-colors"
        >
          ゲームスタート
        </button>
      ) : (
        <p className="text-amber-600 text-sm">ホストがゲームを開始するのを待っています...</p>
      )}
    </div>
  )
}
