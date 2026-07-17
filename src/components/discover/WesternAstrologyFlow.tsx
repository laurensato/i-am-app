'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
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

export default function WesternAstrologyFlow({ factorRow, userId, onComplete }: Props) {
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [birthPlace, setBirthPlace] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ sun_sign: string; moon_sign: string; rising_sign: string; summary: string } | null>(null)
  const supabase = createClient()

  async function handleSubmit() {
    setLoading(true)
    const res = await fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor: 'western_astrology', data: { birthDate, birthTime, birthPlace } }),
    })
    const data = await res.json()
    setResults(data.results)

    await supabase.from('identity_factors').update({
      discovery_completed: true,
      discovery_data: { birthDate, birthTime, birthPlace },
      results: data.results,
    }).eq('user_id', userId).eq('factor_type', 'western_astrology')

    setLoading(false)
  }

  if (results) {
    return (
      <ResultCard title="Your Natal Chart" onContinue={onComplete}>
        <div className="flex gap-3 mb-6">
          {[
            { emoji: '☀️', label: 'Sun', value: results.sun_sign },
            { emoji: '🌙', label: 'Moon', value: results.moon_sign },
            { emoji: '↑', label: 'Rising', value: results.rising_sign },
          ].map(a => (
            <div key={a.label} className="flex-1 text-center p-4 rounded-xl"
              style={{ backgroundColor: 'var(--parchment)' }}>
              <div className="text-2xl mb-1">{a.emoji}</div>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{a.label}</div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>{a.value}</div>
            </div>
          ))}
        </div>
        <p className="text-sm leading-relaxed font-light" style={{ color: 'var(--text-secondary)' }}>{results.summary}</p>
      </ResultCard>
    )
  }

  return (
    <motion.div className="flex flex-col gap-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          Your Birth Chart
        </h2>
        <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
          The positions of the stars at the moment you were born reveal your cosmic blueprint.
        </p>
      </div>

      <Field label="Date of Birth">
        <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border outline-none text-base"
          style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)', color: 'var(--text-primary)' }} />
      </Field>

      <Field label="Time of Birth" hint="Approximate is fine — leave blank if unknown">
        <input type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border outline-none text-base"
          style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)', color: 'var(--text-primary)' }} />
      </Field>

      <Field label="Place of Birth" hint="City, Country">
        <input type="text" placeholder="e.g. Chicago, USA" value={birthPlace} onChange={e => setBirthPlace(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border outline-none text-base"
          style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)', color: 'var(--text-primary)' }} />
      </Field>

      <SubmitButton onClick={handleSubmit} loading={loading} disabled={!birthDate || !birthPlace}>
        Reveal My Chart
      </SubmitButton>
    </motion.div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      {hint && <p className="text-xs mb-2 font-light" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      {children}
    </div>
  )
}
