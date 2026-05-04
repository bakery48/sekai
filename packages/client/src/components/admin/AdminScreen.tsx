import { useState, useEffect, useCallback } from 'react'

type TopicCard = {
  id: string
  text: string
  isCustom: boolean
  enabled: boolean
}

type WordCard = {
  id: string
  text: string
  isCustom: boolean
  enabled: boolean
}

type Props = {
  onBack: () => void
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${enabled ? 'bg-amber-500' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  )
}

export default function AdminScreen({ onBack }: Props) {
  const [tab, setTab] = useState<'topic' | 'word'>('topic')
  const [topicCards, setTopicCards] = useState<TopicCard[]>([])
  const [wordCards, setWordCards] = useState<WordCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  // お題カード追加フォーム
  const [newText, setNewText] = useState('')

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
    if (!newText.trim()) return
    const res = await fetch('/api/cards/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newText }),
    })
    if (res.ok) {
      setNewText('')
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

  const toggleTopic = async (id: string, enabled: boolean) => {
    await fetch(`/api/cards/topic/${id}/enabled`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
    setTopicCards(prev => prev.map(c => c.id === id ? { ...c, enabled } : c))
  }

  const toggleWord = async (id: string, enabled: boolean) => {
    await fetch(`/api/cards/word/${id}/enabled`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
    setWordCards(prev => prev.map(c => c.id === id ? { ...c, enabled } : c))
  }

  const countBlanks = (text: string) => (text.match(/__/g) ?? []).length

  const filteredTopics = topicCards.filter(c => c.text.includes(filter))
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
            <p className="text-xs text-gray-500">空欄の位置に <code className="bg-gray-100 px-1 rounded">__</code> と入力してください（1つだけ）</p>
            <input
              type="text"
              placeholder="私の世界では、__ が一番大切だ"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTopic()}
              className="w-full border border-amber-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
            />
            {newText && countBlanks(newText) !== 1 && (
              <p className="text-xs text-red-500">__ を1つだけ入れてください（現在{countBlanks(newText)}つ）</p>
            )}
            <button
              onClick={addTopic}
              disabled={!newText.trim() || countBlanks(newText) !== 1}
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
            <p className="text-xs text-gray-500">
              {filteredTopics.length}件中 {filteredTopics.filter(c => c.enabled).length}件有効
            </p>
            {filteredTopics.map(card => (
              <div key={card.id} className={`bg-white rounded-lg p-3 border ${!card.enabled ? 'opacity-50' : card.isCustom ? 'border-amber-300' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <Toggle enabled={card.enabled} onChange={v => toggleTopic(card.id, v)} />
                  <p className="flex-1 text-sm text-gray-700 min-w-0">{card.text}</p>
                  {card.isCustom && (
                    <button onClick={() => deleteTopic(card.id)} className="text-red-400 hover:text-red-600 text-lg shrink-0 leading-none">×</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-500">
              {filteredWords.length}件中 {filteredWords.filter(c => c.enabled).length}件有効
            </p>
            {filteredWords.map(card => (
              <div key={card.id} className={`bg-white rounded-lg px-3 py-2 border flex items-center gap-2 ${!card.enabled ? 'opacity-50' : card.isCustom ? 'border-amber-300' : 'border-gray-200'}`}>
                <Toggle enabled={card.enabled} onChange={v => toggleWord(card.id, v)} />
                <span className="flex-1 text-sm text-gray-800">{card.text}</span>
                {card.isCustom && (
                  <button onClick={() => deleteWord(card.id)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
