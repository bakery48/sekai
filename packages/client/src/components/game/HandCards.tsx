import type { WordCard } from '@sekai/shared'

type Props = {
  hand: WordCard[]
  selectedIds: string[]
  onSelect: (id: string) => void
  blanks: number
  disabled: boolean
}

export default function HandCards({ hand, selectedIds, onSelect, blanks, disabled }: Props) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-2 text-center">
        {disabled ? '回答を提出しました' : `${blanks}枚選んで提出 (${selectedIds.length}/${blanks})`}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {hand.map((card) => {
          const selected = selectedIds.includes(card.id)
          return (
            <button
              key={card.id}
              onClick={() => !disabled && onSelect(card.id)}
              disabled={disabled}
              className={`
                rounded-xl p-2 text-sm font-bold border-2 transition-all min-h-[3rem]
                ${selected
                  ? 'bg-amber-500 border-amber-600 text-white shadow-lg scale-95'
                  : 'bg-white border-gray-200 text-gray-800 hover:border-amber-300 hover:bg-amber-50'
                }
                ${disabled ? 'opacity-60 cursor-default' : 'cursor-pointer'}
              `}
            >
              {card.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}
