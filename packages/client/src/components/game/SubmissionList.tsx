import type { ClientSubmission, TopicCard } from '@sekai/shared'

type Props = {
  submissions: ClientSubmission[]
  topic: TopicCard
  onSelect: (index: number) => void
  isJudge: boolean
  selectedIndex: number | null
  lastWinnerId: string | 'dummy' | null
  phase: string
}

export default function SubmissionList({ submissions, topic, onSelect, isJudge, selectedIndex, lastWinnerId, phase }: Props) {
  const parts = topic.frontText.split('__')
  const isResult = phase === 'round_result'

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold text-gray-600 text-center">
        {isJudge && phase === 'judging' ? '一番いいと思う回答を選ぼう！' : '提出された回答'}
      </p>
      {submissions.map((sub, i) => {
        const isWinner = isResult && selectedIndex === i
        return (
          <button
            key={i}
            onClick={() => isJudge && phase === 'judging' && onSelect(i)}
            disabled={!isJudge || phase !== 'judging'}
            className={`
              rounded-xl p-3 border-2 text-left transition-all
              ${isWinner ? 'border-amber-500 bg-amber-50 shadow-lg' : 'border-gray-200 bg-white'}
              ${isJudge && phase === 'judging' ? 'hover:border-amber-300 hover:bg-amber-50 cursor-pointer' : 'cursor-default'}
            `}
          >
            <p className="text-sm text-gray-700 leading-relaxed">
              {parts.map((part, pi) => (
                <span key={pi}>
                  {part}
                  {pi < parts.length - 1 && (
                    <span className="font-bold text-amber-700">
                      {sub.cards[pi]?.text ?? '???'}
                    </span>
                  )}
                </span>
              ))}
            </p>
            {isWinner && (
              <p className="text-xs text-amber-600 font-bold mt-1">
                {lastWinnerId === 'dummy' ? '⚠️ ダミーカード（親マイナス1点）' : '✅ 選ばれました！'}
              </p>
            )}
          </button>
        )
      })}
    </div>
  )
}
