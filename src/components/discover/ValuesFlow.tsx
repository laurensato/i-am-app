'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Diamond, CaretUp, CaretDown, ArrowRight, ArrowLeft } from '@phosphor-icons/react'
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

type Category = 'not_important' | 'important' | 'very_important'
type Phase = 'intro' | 'sort' | 'narrow10' | 'narrow5' | 'reflect' | 'loading' | 'results'

export default function ValuesFlow({ profile, userId, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [sortIndex, setSortIndex] = useState(0)
  const [categories, setCategories] = useState<Record<string, Category>>({})
  const [veryImportant, setVeryImportant] = useState<string[]>([])
  const [top10Selected, setTop10Selected] = useState<string[]>([])
  const [ranked, setRanked] = useState<string[]>([])
  const [reflections, setReflections] = useState<Record<string, string>>({})
  const [reflectIndex, setReflectIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ top_values: string[]; summary: string } | null>(null)
  const supabase = createClient()

  function categorize(cat: Category) {
    const currentValue = ALL_VALUES[sortIndex]
    const nextCategories = { ...categories, [currentValue]: cat }
    setCategories(nextCategories)
    if (sortIndex < ALL_VALUES.length - 1) {
      setSortIndex(i => i + 1)
    } else {
      finishSort(nextCategories)
    }
  }

  function finishSort(finalCategories: Record<string, Category>) {
    const vi = ALL_VALUES.filter(v => finalCategories[v] === 'very_important')
    setVeryImportant(vi)
    if (vi.length > 10) {
      setTop10Selected([])
      setPhase('narrow10')
    } else {
      setRanked(vi)
      setPhase('narrow5')
    }
  }

  function toggleTop10(v: string) {
    setTop10Selected(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : prev.length < 10 ? [...prev, v] : prev
    )
  }

  function confirmTop10() {
    setRanked(top10Selected)
    setPhase('narrow5')
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

  function goToReflect() {
    setReflectIndex(0)
    setPhase('reflect')
  }

  function nextReflect() {
    const top5 = ranked.slice(0, 5)
    if (reflectIndex < top5.length - 1) {
      setReflectIndex(i => i + 1)
    } else {
      handleSubmit()
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setPhase('loading')
    const top5 = ranked.slice(0, 5)
    const res = await fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor: 'values', data: { top_values: top5, very_important: veryImportant, reflections }, profile }),
    })
    const data = await res.json()
    setResults(data.results)

    await supabase.from('identity_factors').update({
      discovery_completed: true,
      discovery_data: { categories, ranked, reflections },
      results: data.results,
    }).eq('user_id', userId).eq('factor_type', 'values')

    setLoading(false)
    setPhase('results')
  }

  if (phase === 'loading') {
    return (
      <div className="text-center py-20">
        <div className="mb-6 inline-block" style={{ color: 'var(--text-muted)' }}><Diamond size={48} weight="thin" /></div>
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
            <div key={v} className="p-4 rounded-xl" style={{ backgroundColor: 'var(--parchment)' }}>
              <div className="flex items-center gap-4 mb-1">
                <span className="text-xl font-normal" style={{ color: 'var(--gold)', fontFamily: 'var(--font-serif)', minWidth: 24 }}>
                  {i + 1}
                </span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{v}</span>
              </div>
              {reflections[v] && (
                <p className="text-xs font-light italic pl-10" style={{ color: 'var(--text-muted)' }}>
                  &ldquo;{reflections[v]}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="text-sm leading-relaxed font-light" style={{ color: 'var(--text-secondary)' }}>{results.summary}</p>
      </ResultCard>
    )
  }

  if (phase === 'reflect') {
    const top5 = ranked.slice(0, 5)
    const value = top5[reflectIndex]
    const isLast = reflectIndex === top5.length - 1

    return (
      <AnimatePresence mode="wait">
        <motion.div key={reflectIndex} className="flex flex-col gap-6"
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}>

          <div className="flex gap-1 mb-2">
            {top5.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all"
                style={{ backgroundColor: i <= reflectIndex ? 'var(--gold)' : 'var(--parchment)' }} />
            ))}
          </div>

          <div>
            <p className="text-xs font-medium mb-2 tracking-widest uppercase" style={{ color: 'var(--gold)' }}>
              #{reflectIndex + 1} · {value}
            </p>
            <h2 className="text-2xl font-normal mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
              Why does this matter to you?
            </h2>
            <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
              What does living {value.toLowerCase()} actually look like in your daily life?
            </p>
          </div>

          <textarea
            rows={4}
            placeholder={`e.g. ${value} matters to me because...`}
            value={reflections[value] ?? ''}
            onChange={e => setReflections({ ...reflections, [value]: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border outline-none text-base resize-none"
            style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)', color: 'var(--text-primary)' }}
          />

          <SubmitButton onClick={nextReflect} loading={loading} disabled={!(reflections[value] ?? '').trim()}>
            {isLast ? 'Reveal My Core Values' : 'Next'}
          </SubmitButton>

          {reflectIndex > 0 && (
            <button onClick={() => setReflectIndex(i => i - 1)}
              className="text-sm font-light text-center" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center justify-center gap-1"><ArrowLeft size={14} weight="regular" /> Back</span>
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    )
  }

  if (phase === 'narrow5') {
    if (ranked.length === 0) {
      return (
        <motion.div className="flex flex-col gap-6 text-center py-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="font-light" style={{ color: 'var(--text-muted)' }}>
            Nothing stood out as very important this round — that&apos;s okay. Go back and mark a few values that resonate most.
          </p>
          <SubmitButton onClick={() => { setSortIndex(0); setPhase('sort') }}>
            Back to sorting
          </SubmitButton>
        </motion.div>
      )
    }

    return (
      <motion.div className="flex flex-col gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h2 className="text-2xl font-normal mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
            Now, rank your top 5
          </h2>
          <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
            Use the arrows to arrange these from most to least important. Your top 5 will move forward for reflection.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {ranked.map((v, i) => (
              <motion.div key={v} layout
                className="flex items-center gap-3 p-4 rounded-xl border"
                style={{
                  backgroundColor: i < 5 ? 'rgba(238,108,90,0.08)' : 'var(--warm-white)',
                  borderColor: i < 5 ? 'var(--gold)' : 'var(--parchment)',
                }}>
                <span className="text-sm font-bold w-6 text-center"
                  style={{ color: i < 5 ? 'var(--gold)' : 'var(--text-muted)' }}>
                  {i + 1}
                </span>
                <span className="flex-1 font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{v}</span>
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveUp(i)} disabled={i === 0}
                    className="px-2 py-0.5 rounded disabled:opacity-20 flex items-center"
                    style={{ color: 'var(--text-muted)' }}><CaretUp size={14} weight="bold" /></button>
                  <button onClick={() => moveDown(i)} disabled={i === ranked.length - 1}
                    className="px-2 py-0.5 rounded disabled:opacity-20 flex items-center"
                    style={{ color: 'var(--text-muted)' }}><CaretDown size={14} weight="bold" /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <SubmitButton onClick={goToReflect}>
          <span className="flex items-center justify-center gap-2">Reflect on my top 5 <ArrowRight size={16} weight="regular" /></span>
        </SubmitButton>
      </motion.div>
    )
  }

  if (phase === 'narrow10') {
    return (
      <motion.div className="flex flex-col gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h2 className="text-2xl font-normal mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
            Narrow it down
          </h2>
          <p className="text-sm font-light mb-1" style={{ color: 'var(--text-muted)' }}>
            You marked {veryImportant.length} values as very important. Choose the ones that matter most — up to 10.
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {top10Selected.length}/10 selected
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {veryImportant.map(v => {
            const sel = top10Selected.includes(v)
            return (
              <motion.button key={v} onClick={() => toggleTop10(v)}
                className="px-3 py-2 rounded-full text-sm border transition-all"
                style={{
                  borderColor: sel ? 'var(--gold)' : 'var(--parchment)',
                  backgroundColor: sel ? 'rgba(238,108,90,0.15)' : 'var(--warm-white)',
                  color: sel ? 'var(--warm-brown)' : 'var(--text-secondary)',
                }}
                whileTap={{ scale: 0.95 }}>
                {v}
              </motion.button>
            )
          })}
        </div>

        <SubmitButton onClick={confirmTop10} disabled={top10Selected.length < 5}>
          <span className="flex items-center justify-center gap-2">Continue <ArrowRight size={16} weight="regular" /></span>
        </SubmitButton>
      </motion.div>
    )
  }

  if (phase === 'sort') {
    const currentValue = ALL_VALUES[sortIndex]
    const progress = (sortIndex / ALL_VALUES.length) * 100

    return (
      <div>
        <div className="mb-8">
          <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            <span>Value {sortIndex + 1} of {ALL_VALUES.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--parchment)' }}>
            <motion.div className="h-full rounded-full" style={{ backgroundColor: 'var(--gold)' }}
              animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={sortIndex}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}>
            <h2 className="text-3xl font-normal text-center mb-10" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
              {currentValue}
            </h2>

            <div className="flex flex-col gap-3">
              <motion.button onClick={() => categorize('not_important')}
                className="w-full py-4 px-5 rounded-2xl border text-sm font-light text-left transition-all"
                style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)', color: 'var(--text-muted)' }}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                Not important to me
              </motion.button>
              <motion.button onClick={() => categorize('important')}
                className="w-full py-4 px-5 rounded-2xl border text-sm font-medium text-left transition-all"
                style={{ borderColor: 'var(--sage-light)', backgroundColor: 'rgba(95,123,78,0.08)', color: 'var(--text-secondary)' }}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                Important to me
              </motion.button>
              <motion.button onClick={() => categorize('very_important')}
                className="w-full py-4 px-5 rounded-2xl border text-base font-semibold text-left transition-all"
                style={{ borderColor: 'var(--gold)', backgroundColor: 'rgba(238,108,90,0.1)', color: 'var(--warm-brown)' }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                Very important to me
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        {sortIndex > 0 && (
          <button onClick={() => setSortIndex(i => i - 1)}
            className="w-full text-sm font-light text-center mt-6" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center justify-center gap-1"><ArrowLeft size={14} weight="regular" /> Back</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <motion.div className="flex flex-col gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h2 className="text-2xl font-normal mb-4" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          The Values Card Sort
        </h2>
        <p className="text-sm leading-relaxed font-light mb-4" style={{ color: 'var(--text-muted)' }}>
          This exercise is adapted from the values card sort therapists use to help people clarify what truly matters to them. You&apos;ll go through {ALL_VALUES.length} values one at a time, sorting each by how important it feels to you.
        </p>
        <p className="text-sm leading-relaxed font-light" style={{ color: 'var(--text-muted)' }}>
          From there, you&apos;ll narrow down to your top 5 and reflect on why each one matters. There are no wrong answers — just honest ones.
        </p>
      </div>
      <motion.button
        onClick={() => setPhase('sort')}
        className="w-full py-4 rounded-xl text-white font-medium text-base"
        style={{ background: 'linear-gradient(135deg, var(--terracotta), var(--rust))' }}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        Begin
      </motion.button>
    </motion.div>
  )
}
