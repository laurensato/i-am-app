'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crosshair, ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { IdentityFactor } from '@/lib/types'
import SubmitButton from './SubmitButton'
import ResultCard from './ResultCard'
import IkigaiChart from './IkigaiChart'

interface Props {
  factorRow: IdentityFactor
  profile: { first_name: string; age: number; gender: string } | null
  userId: string
  onComplete: () => void
}

const SECTIONS = [
  {
    id: 'love',
    key: 'What you LOVE',
    color: 'var(--terracotta)',
    bg: 'rgba(196,113,74,0.08)',
    prompt: 'What activities, subjects, or ways of being fill you with joy and aliveness? When do you lose track of time?',
    placeholder: 'e.g. Writing, teaching others, being in nature, deep conversations...',
    questions: [
      'What have you always been drawn to, even without being asked?',
      'When do you feel most fully yourself?',
      'What could you do for hours without noticing?',
    ],
  },
  {
    id: 'good_at',
    key: 'What you\'re GOOD AT',
    color: 'var(--sage)',
    bg: 'rgba(95,123,78,0.08)',
    prompt: 'What do you do naturally well? What do others often ask for your help with? What skills have you developed over your lifetime?',
    placeholder: 'e.g. Listening deeply, problem-solving, creating structure, storytelling...',
    questions: [
      'What do people come to you for?',
      'What have you done so long it feels effortless?',
      'What were you praised for as a child?',
    ],
  },
  {
    id: 'world_needs',
    key: 'What the WORLD NEEDS',
    color: 'var(--warm-brown)',
    bg: 'rgba(107,76,59,0.08)',
    prompt: 'What problems or gaps in the world move you? What would you fix if you could? What do you notice that others seem to miss?',
    placeholder: 'e.g. More genuine connection, better mental health support, environmental care...',
    questions: [
      'What injustice or lack do you feel most deeply?',
      'What would you want the world to have more of?',
      'What suffering do you feel called to address?',
    ],
  },
  {
    id: 'paid_for',
    key: 'What you can be PAID FOR',
    color: 'var(--gold)',
    bg: 'rgba(238,108,90,0.08)',
    prompt: 'What skills or value have people paid for (or would pay for)? What work has the world recognized and rewarded in you?',
    placeholder: 'e.g. Strategic thinking, design, coaching, technical expertise, coordination...',
    questions: [
      'What have you been hired, paid, or compensated for?',
      'What value do you create that others recognize?',
      'What could you offer that people would exchange money for?',
    ],
  },
]

type Phase = 'intro' | 'section' | 'loading' | 'results'

export default function IkigaiFlow({ profile, userId, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [currentSection, setCurrentSection] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({ love: '', good_at: '', world_needs: '', paid_for: '' })
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ love: string[]; good_at: string[]; world_needs: string[]; paid_for: string[]; ikigai_statement: string; essence?: string } | null>(null)
  const supabase = createClient()

  function nextSection() {
    if (currentSection < SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1)
    } else {
      submitAnswers()
    }
  }

  async function submitAnswers() {
    setLoading(true)
    setPhase('loading')
    const res = await fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor: 'ikigai', data: answers, profile }),
    })
    const data = await res.json()
    setResults(data.results)

    await supabase.from('identity_factors').update({
      discovery_completed: true,
      discovery_data: answers,
      results: data.results,
    }).eq('user_id', userId).eq('factor_type', 'ikigai')

    setLoading(false)
    setPhase('results')
  }

  if (phase === 'loading') {
    return (
      <div className="text-center py-20">
        <div className="mb-6 inline-block" style={{ color: 'var(--text-muted)' }}><Crosshair size={48} weight="thin" /></div>
        <p className="font-light" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-serif)' }}>
          Finding your center...
        </p>
      </div>
    )
  }

  if (phase === 'results' && results) {
    return (
      <ResultCard title="Your Ikigai" onContinue={onComplete}>
        <div className="text-center mb-8 p-6 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, rgba(196,113,74,0.1), rgba(238,108,90,0.1))' }}>
          <p className="text-xs font-medium mb-3 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
            Your Reason for Being
          </p>
          <p className="text-lg font-semibold italic leading-relaxed"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
            &ldquo;{results.ikigai_statement}&rdquo;
          </p>
        </div>
        <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--parchment)' }}>
          <IkigaiChart word={results.essence ?? null} love={results.love} good_at={results.good_at}
            world_needs={results.world_needs} paid_for={results.paid_for} size={320} />
        </div>
      </ResultCard>
    )
  }

  if (phase === 'intro') {
    return (
      <motion.div className="flex flex-col gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h2 className="text-2xl font-normal mb-4" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
            Finding Your Ikigai
          </h2>
          <p className="text-sm leading-relaxed font-light mb-4" style={{ color: 'var(--text-muted)' }}>
            Ikigai (生き甲斐) is a Japanese concept meaning &ldquo;reason for being.&rdquo; It lives at the intersection
            of four things: what you love, what you&apos;re good at, what the world needs, and what you can be paid for.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {SECTIONS.map(s => (
              <div key={s.id} className="p-3 rounded-xl text-center"
                style={{ backgroundColor: s.bg }}>
                <p className="text-xs font-medium" style={{ color: s.color }}>{s.key}</p>
              </div>
            ))}
          </div>
          <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
            Take your time with each section. There are no wrong answers — just honest ones.
          </p>
        </div>
        <motion.button
          onClick={() => setPhase('section')}
          className="w-full py-4 rounded-xl text-white font-medium text-base"
          style={{ background: 'linear-gradient(135deg, var(--terracotta), var(--rust))' }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          Begin
        </motion.button>
      </motion.div>
    )
  }

  const section = SECTIONS[currentSection]

  return (
    <AnimatePresence mode="wait">
      <motion.div key={currentSection} className="flex flex-col gap-6"
        initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.25 }}>

        <div className="flex gap-1 mb-2">
          {SECTIONS.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full transition-all"
              style={{ backgroundColor: i <= currentSection ? section.color : 'var(--parchment)' }} />
          ))}
        </div>

        <div className="p-4 rounded-2xl" style={{ backgroundColor: section.bg }}>
          <p className="font-normal text-lg mb-2" style={{ color: section.color, fontFamily: 'var(--font-serif)' }}>
            {section.key}
          </p>
          <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{section.prompt}</p>
        </div>

        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Prompts to consider:</p>
          <ul className="text-sm font-light space-y-1" style={{ color: 'var(--text-muted)' }}>
            {section.questions.map(q => <li key={q}>· {q}</li>)}
          </ul>
        </div>

        <textarea
          rows={5}
          placeholder={section.placeholder}
          value={answers[section.id]}
          onChange={e => setAnswers({ ...answers, [section.id]: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border outline-none text-base resize-none"
          style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)', color: 'var(--text-primary)' }}
        />

        <SubmitButton
          onClick={nextSection}
          loading={loading}
          disabled={!answers[section.id].trim()}>
          {currentSection < SECTIONS.length - 1
            ? <span className="flex items-center justify-center gap-2">Next: {SECTIONS[currentSection + 1].key} <ArrowRight size={16} weight="regular" /></span>
            : 'Find My Ikigai'}
        </SubmitButton>

        {currentSection > 0 && (
          <button onClick={() => setCurrentSection(currentSection - 1)}
            className="text-sm font-light text-center" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center justify-center gap-1"><ArrowLeft size={14} weight="regular" /> Back</span>
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
