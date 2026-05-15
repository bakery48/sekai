import { useState, useEffect } from 'react'
import type { ClientMessage } from '@sekai/shared'
import { useGameStore } from '../../store/gameStore'
import TopicCardView from './TopicCard'
import HandCards from './HandCards'
import SubmissionList from './SubmissionList'
import ScoreBoard from './ScoreBoard'

type Props = {
  send: (msg: ClientMessage) => void
}

export default function GameScreen({ send }: Props) {
  const {
    roomState, currentTopic, hand, playerId,
    selectedCardIds, submissions, selectCard, clearSelection,
    lastWinnerId, lastWinnerSubmissionIndex, errorMessage,
  } = useGameStore()

  const [submitted, setSubmitted] = useState(false)
  const [discardIds, setDiscardIds] = useState<string[]>([])
  const [discarded, setDiscarded] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [customMode, setCustomMode] = useState(false)
  const [customText, setCustomText] = useState('')

  useEffect(() => {
    setSubmitted(false)
    setDiscardIds([])
    setDiscarded(false)
    setCustomMode(false)
    setCustomText('')
  }, [currentTopic?.id])

  useEffect(() => {
    if (!roomState) return
    if (roomState.phase === 'round_result') {
      setCountdown(10)
      const interval = setInterval(() => {
        setCountdown(prev => (prev !== null && prev > 1 ? prev - 1 : null))
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setCountdown(null)
    }
  }, [roomState?.phase])

  if (!roomState || !currentTopic || !playerId) return null

  const phase = roomState.phase
  const judge = roomState.players[roomState.currentJudgeIndex]
  const isJudge = judge?.id === playerId
  const lastWinnerName = lastWinnerId && lastWinnerId !== 'dummy'
    ? roomState.players.find(p => p.id === lastWinnerId)?.name ?? null
    : null

  const handleSubmit = () => {
    if (selectedCardIds.length !== 1) return
    send({ type: 'submit_answer', roomId: roomState.roomId, cardIds: selectedCardIds })
    setSubmitted(true)
  }

  const handleCustomSubmit = () => {
    if (!customText.trim()) return
    send({ type: 'submit_answer', roomId: roomState.roomId, cardIds: [], customText: customText.trim() })
    setSubmitted(true)
  }

  const handleReveal = (index: number) => {
    send({ type: 'reveal_card', roomId: roomState.roomId, submissionIndex: index })
  }

  const handleSelectWinner = (index: number) => {
    send({ type: 'select_winner', roomId: roomState.roomId, submissionIndex: index })
  }

  const toggleDiscard = (id: string) => {
    setDiscardIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 2 ? [...prev, id] : prev
    )
  }

  const handleDiscard = () => {
    send({ type: 'discard_cards', roomId: roomState.roomId, cardIds: discardIds })
    setDiscardIds([])
    setDiscarded(true)
  }

  const selectedCards = selectedCardIds.map((id) => hand.find((c) => c.id === id)!).filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-lg mx-auto">
      {/* ヘッダー */}
      <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-bold">ラウンド {roomState.roundNumber}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {isJudge ? '👑 あなたが親です' : `👑 親: ${judge?.name}`}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* スコアボード */}
        <ScoreBoard roomState={roomState} playerId={playerId} />

        {/* お題カード */}
        <TopicCardView
          topic={currentTopic}
          selectedCards={phase === 'topic_revealed' ? selectedCards : []}
        />

        {errorMessage && (
          <p className="text-red-500 text-sm text-center bg-red-50 rounded-lg px-3 py-2">{errorMessage}</p>
        )}

        {/* 回答フェーズ */}
        {phase === 'topic_revealed' && (
          <>
            {isJudge ? (
              <div className="text-center text-amber-700 font-bold py-4">
                みんなの回答を待っています...
              </div>
            ) : submitted ? (
              <p className="text-center text-amber-600 font-bold py-2">
                提出済み！親の判定を待っています...
              </p>
            ) : (
              <>
                {!customMode ? (
                  <>
                    <HandCards
                      hand={hand}
                      selectedIds={selectedCardIds}
                      onSelect={selectCard}
                      blanks={1}
                      disabled={false}
                    />
                    <button
                      onClick={handleSubmit}
                      disabled={selectedCardIds.length !== 1}
                      className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                      提出する
                    </button>
                    <button
                      onClick={() => { setCustomMode(true); clearSelection() }}
                      className="text-amber-600 text-sm underline text-center"
                    >
                      オリジナルカードを作って提出する
                    </button>
                  </>
                ) : (
                  <div className="bg-white rounded-xl p-4 border-2 border-amber-300 flex flex-col gap-3">
                    <p className="text-sm font-bold text-amber-700">オリジナル回答カードを作成</p>
                    <p className="text-xs text-gray-500">手札からランダムに1枚が捨てられます</p>
                    <input
                      type="text"
                      placeholder="回答を入力..."
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                      className="border border-amber-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCustomMode(false)}
                        className="flex-1 border border-amber-300 text-amber-600 font-bold py-2 rounded-lg text-sm transition-colors"
                      >
                        戻る
                      </button>
                      <button
                        onClick={handleCustomSubmit}
                        disabled={!customText.trim()}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-sm transition-colors"
                      >
                        作成して提出
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* 審査フェーズ・結果フェーズ */}
        {(phase === 'judging' || phase === 'round_result') && (
          <>
            <SubmissionList
              submissions={submissions}
              topic={currentTopic}
              onReveal={handleReveal}
              onSelect={handleSelectWinner}
              isJudge={isJudge}
              selectedIndex={lastWinnerSubmissionIndex}
              lastWinnerId={lastWinnerId}
              lastWinnerName={lastWinnerName}
              phase={phase}
            />

            {phase === 'round_result' && (
              <>
                {!discarded ? (
                  <div className="bg-white rounded-xl p-4 border-2 border-amber-200 flex flex-col gap-3">
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-sm font-bold text-amber-700">捨てるカードを選んでください（0〜2枚）</p>
                      {countdown !== null && (
                        <span className="text-sm font-bold text-amber-500 bg-amber-50 border border-amber-300 rounded px-2 py-0.5">{countdown}s</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {hand.map(card => (
                        <button
                          key={card.id}
                          onClick={() => toggleDiscard(card.id)}
                          className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                            discardIds.includes(card.id)
                              ? 'bg-red-100 border-red-400 text-red-700 line-through'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-amber-300'
                          }`}
                        >
                          {card.text}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleDiscard}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg text-sm transition-colors"
                    >
                      {discardIds.length === 0 ? 'スキップ' : `${discardIds.length}枚捨てて引く`}
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-amber-600 text-sm">全員の手札交換を待っています...</p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
