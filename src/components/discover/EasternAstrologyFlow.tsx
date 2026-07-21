'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { YinYang } from '@phosphor-icons/react'
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

export default function EasternAstrologyFlow({ profile, userId, onComplete }: Props) {
  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ animal: string; element: string; yin_yang: string; summary: string } | null>(null)
  const supabase = createClient()

  async function handleSubmit() {
    setLoading(true)
    const res = await fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor: 'eastern_astrology', data: { birthYear, birthMonth }, profile }),
    })
    const data = await res.json()
    setResults(data.results)

    await supabase.from('identity_factors').update({
      discovery_completed: true,
      discovery_data: { birthYear, birthMonth },
      results: data.results,
    }).eq('user_id', userId).eq('factor_type', 'eastern_astrology')

    setLoading(false)
  }

  if (results) {
    return (
      <ResultCard title="Your Chinese Zodiac" onContinue={onComplete}>
        <div className="text-center mb-6">
          <div className="mb-3 flex justify-center" style={{ color: 'var(--text-secondary)' }}><YinYang size={56} weight="thin" /></div>
          <h3 className="text-2xl font-normal mb-1" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
            {results.element} {results.animal}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{results.yin_yang}</p>
        </div>
        <p className="text-sm leading-relaxed font-light" style={{ color: 'var(--text-secondary)' }}>{results.summary}</p>
      </ResultCard>
    )
  }

  const currentYear = new Date().getFullYear()

  return (
    <motion.div className="flex flex-col gap-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h2 className="text-2xl font-normal mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          Your Chinese Zodiac
        </h2>
        <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
          Each year carries the energy of an animal and element. The Chinese New Year falls in late January or February,
          so your birth month matters if you were born early in the year.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Birth Year</label>
        <input type="number" min="1920" max={currentYear} placeholder={`e.g. ${currentYear - 30}`}
          value={birthYear} onChange={e => setBirthYear(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border outline-none text-base"
          style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)', color: 'var(--text-primary)' }} />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Birth Month</label>
        <select value={birthMonth} onChange={e => setBirthMonth(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border outline-none text-base"
          style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)', color: 'var(--text-primary)' }}>
          <option value="">Select month</option>
          {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
            <option key={m} value={String(i + 1)}>{m}</option>
          ))}
        </select>
      </div>

      <SubmitButton onClick={handleSubmit} loading={loading} disabled={!birthYear || !birthMonth}>
        Reveal My Sign
      </SubmitButton>
    </motion.div>
  )
}
