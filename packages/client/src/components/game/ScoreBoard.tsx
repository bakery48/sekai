import type { RoomState } from '@sekai/shared'

type Props = {
  roomState: RoomState
  playerId: string
}

export default function ScoreBoard({ roomState, playerId }: Props) {
  const sorted = [...roomState.players].sort((a, b) => b.score - a.score)

  return (
    <div className="bg-white rounded-xl p-3 shadow">
      <p className="text-xs font-bold text-gray-500 mb-2">スコア（目標: {roomState.winThreshold}枚）</p>
      <div className="flex flex-col gap-1">
        {sorted.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 flex-1 truncate">
              {p.name}{p.id === playerId && ' (あなた)'}
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: roomState.winThreshold }).map((_, i) => (
                <span
                  key={i}
                  className={`w-3 h-3 rounded-sm ${i < p.score ? 'bg-amber-400' : 'bg-gray-200'}`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-amber-700 w-6 text-right">{p.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
