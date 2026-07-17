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

const QUESTIONS = [
  {
    id: 'nature',
    question: 'When you feel most at peace, where are you?',
    options: ['In nature', 'In quiet contemplation', 'With community', 'In creative flow', 'In service to others'],
  },
  {
    id: 'divine',
    question: 'How do you experience what is sacred or meaningful?',
    options: ['A universal energy or force', 'A personal God or gods', 'The present moment itself', 'Human connection and love', 'The mystery of existence'],
  },
  {
    id: 'suffering',
    question: 'When you face suffering, what brings you comfort?',
    options: ['Acceptance and releasing attachment', 'Prayer and surrender to a higher power', 'Finding meaning in the pain', 'Community and shared grief', 'Nature\'s cycles of death and renewal'],
  },
  {
    id: 'practice',
    question: 'Which spiritual practice most appeals to you?',
    options: ['Meditation and mindfulness', 'Ritual, ceremony, or prayer', 'Study of sacred texts', 'Movement or embodied practice (yoga, dance)', 'Acts of service or charity'],
  },
  {
    id: 'self',
    question: 'How do you think about your individual self?',
    options: ['A temporary expression of something universal', 'A soul on a journey toward something greater', 'A unique story I\'m authoring', 'A relational being shaped by others', 'An observer experiencing life'],
  },
  {
    id: 'death',
    question: 'What feels truest about death and what comes after?',
    options: ['A return to the source — energy transforming', 'A transition to another realm or state', 'The end of this particular story', 'Continuation through legacy and love', 'An open mystery I hold with curiosity'],
  },
  {
    id: 'virtue',
    question: 'What virtue feels most central to living well?',
    options: ['Compassion for all beings', 'Devotion and faith', 'Wisdom and discernment', 'Justice and service', 'Presence and gratitude'],
  },
  {
    id: 'cosmos',
    question: 'What is your relationship to the cosmos?',
    options: ['I am made of stardust — part of it all', 'I was created with intention and purpose', 'I am a witness to its unfolding', 'I find meaning through my relationships within it', 'I am shaped by forces larger than I can understand'],
  },
]

export default function SpiritualityFlow({ userId, onComplete }: Props) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ traditions: string[]; themes: string[]; summary: string } | null>(null)
  const supabase = createClient()

  function selectAnswer(answer: string) {
    const newAnswers = { ...answers, [QUESTIONS[currentQ].id]: answer }
    setAnswers(newAnswers)
    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ(currentQ + 1), 300)
    } else {
      submitAnswers(newAnswers)
    }
  }

  async function submitAnswers(finalAnswers: Record<string, string>) {
    setLoading(true)
    const res = await fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor: 'spirituality', data: { answers: finalAnswers } }),
    })
    const data = await res.json()
    setResults(data.results)

    await supabase.from('identity_factors').update({
      discovery_completed: true,
      discovery_data: { answers: finalAnswers },
      results: data.results,
    }).eq('user_id', userId).eq('factor_type', 'spirituality')

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-6 float inline-block">🕯️</div>
        <p className="font-light" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-serif)' }}>
          Reflecting on your answers...
        </p>
      </div>
    )
  }

  if (results) {
    return (
      <ResultCard title="Your Spiritual Landscape" onContinue={onComplete}>
        <div className="mb-6">
          <p className="text-xs font-medium mb-3 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
            Resonant Traditions
          </p>
          <div className="flex flex-wrap gap-2">
            {results.traditions.map(t => (
              <span key={t} className="px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: 'rgba(122,158,126,0.15)', color: 'var(--sage)' }}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <p className="text-xs font-medium mb-3 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
            Core Themes
          </p>
          <div className="flex flex-wrap gap-2">
            {results.themes.map(t => (
              <span key={t} className="px-3 py-1.5 rounded-full text-sm"
                style={{ backgroundColor: 'var(--parchment)', color: 'var(--text-secondary)' }}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <p className="text-sm leading-relaxed font-light" style={{ color: 'var(--text-secondary)' }}>{results.summary}</p>
      </ResultCard>
    )
  }

  const q = QUESTIONS[currentQ]
  const progress = (currentQ / QUESTIONS.length) * 100

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
          <span>Question {currentQ + 1} of {QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--parchment)' }}>
          <motion.div className="h-full rounded-full" style={{ backgroundColor: 'var(--sage)' }}
            animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentQ}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}>
          <h2 className="text-2xl font-bold mb-8" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
            {q.question}
          </h2>
          <div className="flex flex-col gap-3">
            {q.options.map(opt => (
              <motion.button key={opt} onClick={() => selectAnswer(opt)}
                className="text-left px-5 py-4 rounded-2xl border text-sm font-light transition-all"
                style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)', color: 'var(--text-primary)' }}
                whileHover={{ scale: 1.01, borderColor: 'var(--sage)', backgroundColor: 'rgba(122,158,126,0.06)' }}
                whileTap={{ scale: 0.98 }}>
                {opt}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
