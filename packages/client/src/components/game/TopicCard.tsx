import type { TopicCard, WordCard } from '@sekai/shared'

type Props = {
  topic: TopicCard
  selectedCards: WordCard[]
}

export default function TopicCardView({ topic, selectedCards }: Props) {
  const parts = topic.frontText.split('__')

  return (
    <div className="bg-amber-100 border-2 border-amber-400 rounded-2xl p-4 shadow-md text-center">
      <p className="text-xs text-amber-600 mb-2 font-bold">お題</p>
      <p className="text-lg font-bold text-amber-900 leading-relaxed">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <span className="inline-block min-w-[4rem] border-b-2 border-amber-600 mx-1 text-amber-700 font-bold">
                {selectedCards[i]?.text ?? '    '}
              </span>
            )}
          </span>
        ))}
      </p>
    </div>
  )
}
