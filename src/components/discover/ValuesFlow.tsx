'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { IdentityFactor } from '@/lib/types'
import SubmitButton from './SubmitButton'
import ResultCard from './ResultCard'

interface Props {
  factorRow: IdentityFactor
  profile: { first_name: string; age: number; gender: string } | null
  userId: string
  onComplete: () => void
}

const ALL_VALUES = [
  'Authenticity','Adventure','Balance','Belonging','Compassion','Courage','Creativity',
  'Curiosity','Dedication','Empathy','Excellence','Family','Freedom','Generosity',
  'Growth','Harmony','Health','Honesty','Hope','Humor','Impact','Independence',
  'Integrity','Joy','Justice','Kindness','Learning','Legacy','Love','Loyalty',
  'Mindfulness','Nature','Openness','Passion','Peace','Perseverance','Play',
  'Purpose','Resilience','Respect','Security','Service','Simplicity','Spirituality',
  'Strength','Tradition','Trust','Truth','Vulnerability','Wisdom',
]

type Phase = 'select' | 'rank' | 'loading' | 'results'

export default function ValuesFlow({ userId, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('select')
  const [selected, setSelected] = useState<string[]>([])
  const [ranked, setRanked] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ top_values: string[]; summary: string } | null>(null)
  const supabase = createClient()

  function toggleValue(v: string) {
    setSelected(prev =>
      prev.includes(v)
        ? prev.filter(x => x !== v)
        : prev.length < 10 ? [...prev, v] : prev
    )
  }

  function goToRank() {
    setRanked([...selected])
    setPhase('rank')
  }

  function moveUp(i: number) {
    if (i === 0) return
    const arr = [...ranked]
    ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
    setRanked(arr)
  }

  function moveDown(i: number) {
    if (i === ranked.length - 1) return
    const arr = [...ranked]
    ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
    setRanked(arr)
  }

  async function handleSubmit() {
    setLoading(true)
    setPhase('loading')
    const top5 = ranked.slice(0, 5)
    const res = await fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor: 'values', data: { top_values: top5, all_selected: ranked } }),
    })
    const data = await res.json()
    setResults(data.results)

    await supabase.from('identity_factors').update({
      discovery_completed: true,
      discovery_data: { ranked },
      results: data.results,
    }).eq('user_id', userId).eq('factor_type', 'values')

    setLoading(false)
    setPhase('results')
  }

  if (phase === 'loading') {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-6 float inline-block">💎</div>
        <p className="font-light" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-serif)' }}>
          Reflecting on what matters most to you...
        </p>
      </div>
    )
  }

  if (phase === 'results' && results) {
    return (
      <ResultCard title="Your Core Values" onContinue={onComplete}>
        <div className="flex flex-col gap-3 mb-6">
          {results.top_values.map((v, i) => (
            <div key={v} className="flex items-center gap-4 p-4 rounded-xl"
              style={{ backgroundColor: 'var(--parchment)' }}>
              <span className="text-xl font-bold" style={{ color: 'var(--gold)', fontFamily: 'var(--font-serif)', minWidth: 24 }}>
                {i + 1}
              </span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{v}</span>
            </div>
          ))}
        </div>
        <p className="text-sm leading-relaxed font-light" style={{ color: 'var(--text-secondary)' }}>{results.summary}</p>
      </ResultCard>
    )
  }

  if (phase === 'rank') {
    return (
      <motion.div className="flex flex-col gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
            Now, rank them
          </h2>
          <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
            Use the arrows to arrange your values from most to least important. Your top 5 will form your core.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {ranked.map((v, i) => (
              <motion.div key={v} layout
                className="flex items-center gap-3 p-4 rounded-xl border"
                style={{
                  backgroundColor: i < 5 ? 'rgba(201,169,110,0.08)' : 'var(--warm-white)',
                  borderColor: i < 5 ? 'var(--gold)' : 'var(--parchment)',
                }}>
                <span className="text-sm font-bold w-6 text-center"
                  style={{ color: i < 5 ? 'var(--gold)' : 'var(--text-muted)' }}>
                  {i + 1}
                </span>
                <span className="flex-1 font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{v}</span>
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveUp(i)} disabled={i === 0}
                    className="text-xs px-2 py-0.5 rounded disabled:opacity-20"
                    style={{ color: 'var(--text-muted)' }}>▲</button>
                  <button onClick={() => moveDown(i)} disabled={i === ranked.length - 1}
                    className="text-xs px-2 py-0.5 rounded disabled:opacity-20"
                    style={{ color: 'var(--text-muted)' }}>▼</button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <SubmitButton onClick={handleSubmit} loading={loading}>
          These are my values
        </SubmitButton>
      </motion.div>
    )
  }

  return (
    <motion.div className="flex flex-col gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          What do you value most?
        </h2>
        <p className="text-sm font-light mb-1" style={{ color: 'var(--text-muted)' }}>
          Select up to 10 values that feel most true to who you are — not who you think you should be.
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {selected.length}/10 selected
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ALL_VALUES.map(v => {
          const sel = selected.includes(v)
          return (
            <motion.button key={v} onClick={() => toggleValue(v)}
              className="px-3 py-2 rounded-full text-sm border transition-all"
              style={{
                borderColor: sel ? 'var(--gold)' : 'var(--parchment)',
                backgroundColor: sel ? 'rgba(201,169,110,0.15)' : 'var(--warm-white)',
                color: sel ? 'var(--warm-brown)' : 'var(--text-secondary)',
              }}
              whileTap={{ scale: 0.95 }}>
              {v}
            </motion.button>
          )
        })}
      </div>

      <SubmitButton onClick={goToRank} disabled={selected.length < 3}>
        Rank my values →
      </SubmitButton>
    </motion.div>
  )
}
