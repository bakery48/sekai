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
    lastWinnerId, errorMessage,
  } = useGameStore()

  const [submitted, setSubmitted] = useState(false)
  const [selectedWinnerIndex, setSelectedWinnerIndex] = useState<number | null>(null)

  useEffect(() => {
    setSubmitted(false)
    setSelectedWinnerIndex(null)
  }, [currentTopic?.id])

  if (!roomState || !currentTopic || !playerId) return null

  const phase = roomState.phase
  const judge = roomState.players[roomState.currentJudgeIndex]
  const isJudge = judge?.id === playerId
  const me = roomState.players.find((p) => p.id === playerId)

  const handleSubmit = () => {
    if (selectedCardIds.length !== currentTopic.blanks) return
    send({ type: 'submit_answer', roomId: roomState.roomId, cardIds: selectedCardIds })
    setSubmitted(true)
  }

  const handleReveal = (index: number) => {
    send({ type: 'reveal_card', roomId: roomState.roomId, submissionIndex: index })
  }

  const handleSelectWinner = (index: number) => {
    setSelectedWinnerIndex(index)
    send({ type: 'select_winner', roomId: roomState.roomId, submissionIndex: index })
  }

  const handleNextRound = () => {
    send({ type: 'next_round', roomId: roomState.roomId })
    setSubmitted(false)
    setSelectedWinnerIndex(null)
    clearSelection()
  }

  const selectedCards = selectedCardIds.map((id) => hand.find((c) => c.id === id)!).filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-lg mx-auto">
      {/* ヘッダー */}
      <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-bold">ラウンド {roomState.roundNumber}</span>
        <span className="text-sm">
          {isJudge ? '👑 あなたが親です' : `👑 親: ${judge?.name}`}
        </span>
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
            ) : (
              <>
                <HandCards
                  hand={hand}
                  selectedIds={selectedCardIds}
                  onSelect={selectCard}
                  blanks={currentTopic.blanks}
                  disabled={submitted}
                />
                {!submitted && (
                  <button
                    onClick={handleSubmit}
                    disabled={selectedCardIds.length !== currentTopic.blanks}
                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    提出する
                  </button>
                )}
                {submitted && (
                  <p className="text-center text-amber-600 font-bold py-2">
                    提出済み！親の判定を待っています...
                  </p>
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
              selectedIndex={selectedWinnerIndex}
              lastWinnerId={lastWinnerId}
              phase={phase}
            />

            {phase === 'round_result' && isJudge && (
              <button
                onClick={handleNextRound}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors"
              >
                次のラウンドへ
              </button>
            )}
            {phase === 'round_result' && !isJudge && (
              <p className="text-center text-amber-600 text-sm">親が次のラウンドを開始するのを待っています...</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
