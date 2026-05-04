import { useState, useEffect, useCallback } from 'react'

type TopicCard = {
  id: string
  frontText: string
  backText: string
  blanks: 1 | 2
  isCustom: boolean
}

type WordCard = {
  id: string
  text: string
  isCustom: boolean
}

type Props = {
  onBack: () => void
}

export default function AdminScreen({ onBack }: Props) {
  const [tab, setTab] = useState<'topic' | 'word'>('topic')
  const [topicCards, setTopicCards] = useState<TopicCard[]>([])
  const [wordCards, setWordCards] = useState<WordCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  // お題カード追加フォーム
  const [newFront, setNewFront] = useState('')
  const [newBack, setNewBack] = useState('')
  const [newBlanks, setNewBlanks] = useState<1 | 2>(1)

  // 答えカード追加フォーム
  const [newWord, setNewWord] = useState('')

  const fetchCards = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cards')
      const data = await res.json()
      setTopicCards(data.topicCards)
      setWordCards(data.wordCards)
    } catch {
      setError('カードの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCards() }, [fetchCards])

  const addTopic = async () => {
    if (!newFront.trim() || !newBack.trim()) return
    const res = await fetch('/api/cards/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frontText: newFront, backText: newBack, blanks: newBlanks }),
    })
    if (res.ok) {
      setNewFront('')
      setNewBack('')
      setNewBlanks(1)
      fetchCards()
    }
  }

  const addWord = async () => {
    if (!newWord.trim()) return
    const res = await fetch('/api/cards/word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newWord }),
    })
    if (res.ok) {
      setNewWord('')
      fetchCards()
    }
  }

  const deleteTopic = async (id: string) => {
    await fetch(`/api/cards/topic/${id}`, { method: 'DELETE' })
    fetchCards()
  }

  const deleteWord = async (id: string) => {
    await fetch(`/api/cards/word/${id}`, { method: 'DELETE' })
    fetchCards()
  }

  const countBlanks = (text: string) => (text.match(/__/g) ?? []).length

  const filteredTopics = topicCards.filter(c =>
    c.frontText.includes(filter) || c.backText.includes(filter)
  )
  const filteredWords = wordCards.filter(c => c.text.includes(filter))

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col max-w-lg mx-auto">
      <div className="bg-amber-500 text-white px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-white font-bold text-lg">←</button>
        <h1 className="font-bold text-lg">カード管理</h1>
      </div>

      {/* タブ */}
      <div className="flex border-b-2 border-amber-200 bg-white">
        <button
          onClick={() => setTab('topic')}
          className={`flex-1 py-3 font-bold text-sm transition-colors ${tab === 'topic' ? 'text-amber-600 border-b-2 border-amber-500' : 'text-gray-400'}`}
        >
          お題カード {topicCards.length > 0 && `(${topicCards.length})`}
        </button>
        <button
          onClick={() => setTab('word')}
          className={`flex-1 py-3 font-bold text-sm transition-colors ${tab === 'word' ? 'text-amber-600 border-b-2 border-amber-500' : 'text-gray-400'}`}
        >
          答えカード {wordCards.length > 0 && `(${wordCards.length})`}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* 検索 */}
        <input
          type="text"
          placeholder="絞り込み..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border-2 border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
        />

        {/* お題カード追加フォーム */}
        {tab === 'topic' && (
          <div className="bg-white rounded-xl p-4 border-2 border-amber-200 flex flex-col gap-3">
            <p className="text-sm font-bold text-amber-700">新しいお題カードを追加</p>
            <p className="text-xs text-gray-500">空欄の位置に <code className="bg-gray-100 px-1 rounded">__</code> と入力してください</p>
            <div className="flex gap-2 items-center">
              <label className="text-xs text-gray-600 w-12 shrink-0">空欄数</label>
              <select
                value={newBlanks}
                onChange={(e) => setNewBlanks(Number(e.target.value) as 1 | 2)}
                className="border border-amber-200 rounded px-2 py-1 text-sm"
              >
                <option value={1}>1つ</option>
                <option value={2}>2つ</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600">表面</label>
              <input
                type="text"
                placeholder="私の世界では、__ が一番大切だ"
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                className="w-full border border-amber-200 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-amber-400"
              />
              {newFront && countBlanks(newFront) !== newBlanks && (
                <p className="text-xs text-red-500 mt-1">__の数が{newBlanks}つになるよう入力してください（現在{countBlanks(newFront)}つ）</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-600">裏面</label>
              <input
                type="text"
                placeholder="私の世界では、__ は存在しない"
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                className="w-full border border-amber-200 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-amber-400"
              />
              {newBack && countBlanks(newBack) !== newBlanks && (
                <p className="text-xs text-red-500 mt-1">__の数が{newBlanks}つになるよう入力してください（現在{countBlanks(newBack)}つ）</p>
              )}
            </div>
            <button
              onClick={addTopic}
              disabled={
                !newFront.trim() || !newBack.trim() ||
                countBlanks(newFront) !== newBlanks ||
                countBlanks(newBack) !== newBlanks
              }
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold py-2 rounded-lg text-sm transition-colors"
            >
              追加
            </button>
          </div>
        )}

        {/* 答えカード追加フォーム */}
        {tab === 'word' && (
          <div className="bg-white rounded-xl p-4 border-2 border-amber-200 flex flex-col gap-3">
            <p className="text-sm font-bold text-amber-700">新しい答えカードを追加</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="カードのテキスト"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addWord()}
                className="flex-1 border border-amber-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={addWord}
                disabled={!newWord.trim()}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold px-4 rounded-lg text-sm transition-colors"
              >
                追加
              </button>
            </div>
          </div>
        )}

        {/* カード一覧 */}
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-4">読み込み中...</p>
        ) : tab === 'topic' ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-500">{filteredTopics.length}件</p>
            {filteredTopics.map(card => (
              <div key={card.id} className={`bg-white rounded-lg p-3 border ${card.isCustom ? 'border-amber-300' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">表: <span className="text-gray-700">{card.frontText}</span></p>
                    <p className="text-xs text-gray-400">裏: <span className="text-gray-700">{card.backText}</span></p>
                    <p className="text-xs text-amber-600 mt-1">空欄{card.blanks}つ {card.isCustom && '・カスタム'}</p>
                  </div>
                  {card.isCustom && (
                    <button
                      onClick={() => deleteTopic(card.id)}
                      className="text-red-400 hover:text-red-600 text-lg shrink-0 leading-none"
                    >×</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-500">{filteredWords.length}件</p>
            {filteredWords.map(card => (
              <div key={card.id} className={`bg-white rounded-lg px-3 py-2 border flex items-center justify-between ${card.isCustom ? 'border-amber-300' : 'border-gray-200'}`}>
                <span className="text-sm text-gray-800">{card.text} {card.isCustom && <span className="text-xs text-amber-500">カスタム</span>}</span>
                {card.isCustom && (
                  <button
                    onClick={() => deleteWord(card.id)}
                    className="text-red-400 hover:text-red-600 text-lg leading-none ml-2"
                  >×</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
