import type { RoomState } from '@sekai/shared'

type Props = {
  roomState: RoomState
  playerId: string
  gameOverWinnerId: string | null
}

export default function ResultScreen({ roomState, playerId, gameOverWinnerId }: Props) {
  const winner = roomState.players.find((p) => p.id === gameOverWinnerId)
  const isWinner = gameOverWinnerId === playerId
  const sorted = [...roomState.players].sort((a, b) => b.score - a.score)

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-6">
      <div className="text-6xl mb-4">{isWinner ? '🎉' : '🎊'}</div>
      <h1 className="text-3xl font-bold text-amber-900 mb-1">ゲーム終了！</h1>
      <p className="text-xl text-amber-700 mb-8">
        <span className="font-bold">{winner?.name}</span> の勝ち！
      </p>

      <div className="bg-white rounded-2xl p-5 shadow w-full max-w-sm">
        <p className="text-sm font-bold text-gray-500 mb-3">最終スコア</p>
        <div className="flex flex-col gap-2">
          {sorted.map((p, i) => (
            <div key={p.id} className={`flex items-center gap-3 p-2 rounded-lg ${i === 0 ? 'bg-amber-50' : ''}`}>
              <span className="text-lg w-6 text-center">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
              </span>
              <span className="flex-1 font-medium text-gray-800">
                {p.name}{p.id === playerId && <span className="text-xs text-gray-400 ml-1">(あなた)</span>}
              </span>
              <span className="font-bold text-amber-700">{p.score}枚</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="mt-8 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-xl text-lg transition-colors"
      >
        もう一度遊ぶ
      </button>
    </div>
  )
}
