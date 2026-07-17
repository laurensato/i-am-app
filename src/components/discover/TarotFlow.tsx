'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { IdentityFactor } from '@/lib/types'
import ResultCard from './ResultCard'

interface Props {
  factorRow: IdentityFactor
  profile: { first_name: string; age: number; gender: string } | null
  userId: string
  onComplete: () => void
}

const TAROT_DECK = [
  'The Fool','The Magician','The High Priestess','The Empress','The Emperor',
  'The Hierophant','The Lovers','The Chariot','Strength','The Hermit',
  'Wheel of Fortune','Justice','The Hanged Man','Death','Temperance',
  'The Devil','The Tower','The Star','The Moon','The Sun','Judgement','The World',
  'Ace of Wands','Two of Wands','Three of Wands','Four of Wands','Five of Wands',
  'Six of Wands','Seven of Wands','Eight of Wands','Nine of Wands','Ten of Wands',
  'Page of Wands','Knight of Wands','Queen of Wands','King of Wands',
  'Ace of Cups','Two of Cups','Three of Cups','Four of Cups','Five of Cups',
  'Six of Cups','Seven of Cups','Eight of Cups','Nine of Cups','Ten of Cups',
  'Page of Cups','Knight of Cups','Queen of Cups','King of Cups',
  'Ace of Swords','Two of Swords','Three of Swords','Four of Swords','Five of Swords',
  'Six of Swords','Seven of Swords','Eight of Swords','Nine of Swords','Ten of Swords',
  'Page of Swords','Knight of Swords','Queen of Swords','King of Swords',
  'Ace of Pentacles','Two of Pentacles','Three of Pentacles','Four of Pentacles','Five of Pentacles',
  'Six of Pentacles','Seven of Pentacles','Eight of Pentacles','Nine of Pentacles','Ten of Pentacles',
  'Page of Pentacles','Knight of Pentacles','Queen of Pentacles','King of Pentacles',
]

const POSITIONS = ['Past', 'Present', 'Future']

type Phase = 'intention' | 'shuffle' | 'draw' | 'loading' | 'results'

interface DrawnCard { name: string; position: string; reversed: boolean }

export default function TarotFlow({ userId, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('intention')
  const [intention, setIntention] = useState('')
  const [deck, setDeck] = useState([...TAROT_DECK])
  const [drawn, setDrawn] = useState<DrawnCard[]>([])
  const [revealed, setRevealed] = useState<boolean[]>([])
  const [results, setResults] = useState<{ cards: DrawnCard[]; summary: string } | null>(null)
  const supabase = createClient()

  function startShuffle() {
    // Fisher-Yates shuffle
    const arr = [...TAROT_DECK]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    setDeck(arr)
    setPhase('shuffle')
    setTimeout(() => setPhase('draw'), 2500)
  }

  function drawCard(position: string) {
    if (drawn.find(d => d.position === position)) return
    const card = deck[drawn.length]
    const reversed = Math.random() < 0.3
    const newDrawn = [...drawn, { name: card, position, reversed }]
    setDrawn(newDrawn)
    setRevealed(prev => [...prev, false])

    setTimeout(() => {
      setRevealed(prev => { const r = [...prev]; r[r.length - 1] = true; return r })
    }, 400)

    if (newDrawn.length === 3) {
      setTimeout(() => submitReading(newDrawn), 1000)
    }
  }

  async function submitReading(cards: DrawnCard[]) {
    setPhase('loading')
    const res = await fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor: 'tarot', data: { intention, cards } }),
    })
    const data = await res.json()
    const fullResults = { cards: data.results.cards ?? cards, summary: data.results.summary }
    setResults(fullResults)

    await supabase.from('identity_factors').update({
      discovery_completed: true,
      discovery_data: { intention, cards },
      results: fullResults,
    }).eq('user_id', userId).eq('factor_type', 'tarot')

    setPhase('results')
  }

  if (phase === 'results' && results) {
    return (
      <ResultCard title="Your Reading" onContinue={onComplete}>
        <div className="flex flex-col gap-4 mb-6">
          {results.cards.map(card => (
            <div key={card.position} className="p-4 rounded-xl" style={{ backgroundColor: 'var(--parchment)' }}>
              <p className="text-xs font-medium mb-1 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                {card.position}
              </p>
              <p className="font-semibold mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                {card.name} {card.reversed && <span className="text-xs">(Reversed)</span>}
              </p>
              <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>
                {(results as { cards: (DrawnCard & { meaning?: string })[] }).cards.find(c => c.position === card.position)?.meaning}
              </p>
            </div>
          ))}
        </div>
        <p className="text-sm leading-relaxed font-light" style={{ color: 'var(--text-secondary)' }}>{results.summary}</p>
      </ResultCard>
    )
  }

  if (phase === 'loading') {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-6 float inline-block">🃏</div>
        <p className="font-light" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-serif)' }}>
          Reading the cards...
        </p>
      </div>
    )
  }

  if (phase === 'intention') {
    return (
      <motion.div className="flex flex-col gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
            Set Your Intention
          </h2>
          <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
            Before we draw, bring a question or area of your life into focus. What is calling for your attention?
          </p>
        </div>
        <textarea
          rows={3}
          placeholder="e.g. What do I need to understand about this next chapter of my life?"
          value={intention}
          onChange={e => setIntention(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border outline-none text-base resize-none"
          style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)', color: 'var(--text-primary)' }}
        />
        <motion.button
          onClick={startShuffle}
          disabled={!intention.trim()}
          className="w-full py-4 rounded-xl text-white font-medium text-base disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, var(--terracotta), var(--rust))' }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          Shuffle the Deck
        </motion.button>
      </motion.div>
    )
  }

  if (phase === 'shuffle') {
    return (
      <div className="text-center py-16">
        <motion.div
          className="text-6xl mb-8 inline-block"
          animate={{ rotateY: [0, 180, 360], scale: [1, 0.9, 1] }}
          transition={{ duration: 0.8, repeat: 3 }}>
          🃏
        </motion.div>
        <p className="text-lg font-light" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-serif)' }}>
          Shuffling the deck...
        </p>
        <p className="text-sm mt-2 font-light" style={{ color: 'var(--text-muted)' }}>
          Hold your intention in mind.
        </p>
      </div>
    )
  }

  // Draw phase
  const remainingPositions = POSITIONS.filter(p => !drawn.find(d => d.position === p))

  return (
    <motion.div className="flex flex-col gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          Draw Your Cards
        </h2>
        <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
          Click each position to draw a card.
        </p>
      </div>

      <div className="flex gap-4 justify-center">
        {POSITIONS.map((pos, i) => {
          const card = drawn.find(d => d.position === pos)
          const isRevealed = revealed[drawn.findIndex(d => d.position === pos)]
          const canDraw = !card && drawn.length === i

          return (
            <motion.div key={pos} className="flex-1 flex flex-col items-center gap-2">
              <motion.div
                onClick={() => canDraw && drawCard(pos)}
                className="w-full aspect-[2/3] rounded-2xl flex items-center justify-center cursor-pointer border-2 transition-all relative overflow-hidden"
                style={{
                  borderColor: card ? 'var(--gold)' : canDraw ? 'var(--terracotta)' : 'var(--parchment)',
                  backgroundColor: card ? 'var(--parchment)' : canDraw ? 'rgba(196,113,74,0.06)' : 'var(--warm-white)',
                }}
                whileHover={canDraw ? { scale: 1.03 } : {}}
                whileTap={canDraw ? { scale: 0.97 } : {}}
              >
                <AnimatePresence>
                  {card && isRevealed ? (
                    <motion.div
                      className="text-center p-3"
                      initial={{ opacity: 0, rotateY: 90 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      transition={{ duration: 0.4 }}>
                      <div className="text-2xl mb-2">🃏</div>
                      <p className="text-xs font-semibold leading-tight" style={{
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-serif)',
                        transform: card.reversed ? 'rotate(180deg)' : 'none'
                      }}>
                        {card.name}
                      </p>
                    </motion.div>
                  ) : card ? (
                    <div className="text-3xl">🃏</div>
                  ) : (
                    <div className="text-center">
                      {canDraw ? (
                        <><div className="text-2xl mb-1">✦</div>
                        <p className="text-xs" style={{ color: 'var(--terracotta)' }}>Tap</p></>
                      ) : (
                        <div className="text-2xl opacity-20">·</div>
                      )}
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{pos}</span>
            </motion.div>
          )
        })}
      </div>

      {remainingPositions.length > 0 && (
        <p className="text-center text-sm font-light" style={{ color: 'var(--text-muted)' }}>
          Draw: <strong style={{ color: 'var(--text-secondary)' }}>{remainingPositions[0]}</strong>
        </p>
      )}
    </motion.div>
  )
}
