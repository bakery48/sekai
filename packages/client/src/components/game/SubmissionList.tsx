import type { ClientSubmission, TopicCard } from '@sekai/shared'

type Props = {
  submissions: ClientSubmission[]
  topic: TopicCard
  onReveal: (index: number) => void
  onSelect: (index: number) => void
  isJudge: boolean
  selectedIndex: number | null
  lastWinnerId: string | 'dummy' | null
  lastWinnerName: string | null
  phase: string
}

export default function SubmissionList({ submissions, topic: _topic, onReveal, onSelect, isJudge, selectedIndex, lastWinnerId, lastWinnerName, phase }: Props) {
  const isResult = phase === 'round_result'
  const allRevealed = submissions.length > 0 && submissions.every(s => s.isRevealed)

  const label = isJudge && phase === 'judging'
    ? allRevealed
      ? '一番いいと思う回答を選ぼう！'
      : 'カードをクリックして開けよう！'
    : phase === 'judging'
      ? '親がカードを開けています...'
      : '提出された回答'

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold text-gray-600 text-center">{label}</p>
      {submissions.map((sub, i) => {
        const isWinner = isResult && selectedIndex === i
        const canReveal = isJudge && phase === 'judging' && !sub.isRevealed
        const canSelect = isJudge && phase === 'judging' && allRevealed

        if (!sub.isRevealed) {
          return (
            <button
              key={i}
              onClick={() => canReveal && onReveal(i)}
              disabled={!canReveal}
              className={`
                rounded-xl p-4 border-2 text-center transition-all
                bg-amber-500 border-amber-600
                ${canReveal ? 'hover:bg-amber-400 active:scale-95 cursor-pointer' : 'cursor-default opacity-60'}
              `}
            >
              <span className="text-white text-3xl font-bold select-none">？</span>
            </button>
          )
        }

        return (
          <button
            key={i}
            onClick={() => canSelect && onSelect(i)}
            disabled={!canSelect}
            className={`
              rounded-xl p-3 border-2 text-left transition-all
              ${isWinner ? 'border-amber-500 bg-amber-50 shadow-lg' : 'border-gray-200 bg-white'}
              ${canSelect ? 'hover:border-amber-300 hover:bg-amber-50 active:scale-95 cursor-pointer' : 'cursor-default'}
            `}
          >
            <p className="text-lg font-bold text-amber-800 text-center py-1">
              {sub.cards[0]?.text ?? '???'}
            </p>
            {isWinner && (
              <p className="text-xs text-amber-600 font-bold mt-1">
                {lastWinnerId === 'dummy'
                  ? '⚠️ ダミーカード（親マイナス1点）'
                  : `✅ ${lastWinnerName ?? ''}さんの回答が選ばれました！`}
              </p>
            )}
          </button>
        )
      })}
    </div>
  )
}
