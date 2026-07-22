'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { YinYang, ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { IdentityFactor } from '@/lib/types'
import SubmitButton from './SubmitButton'

interface EasternResults {
  animal: string
  element: string
  yin_yang: string
  summary: string
  essence: string
  personality: {
    core: string
    in_relationships: string
    at_work: string
    under_pressure: string
  }
  strengths: string[]
  shadows: string[]
  element_nature: {
    essence: string
    expression: string
    nourished_by: string
    depleted_by: string
  }
  year_2026: {
    year_animal: string
    year_element: string
    relationship: string
    relationship_quality: 'supportive' | 'challenging' | 'neutral'
    reading: string
  }
}

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
  const [results, setResults] = useState<EasternResults | null>(null)
  const supabase = createClient()

  async function handleSubmit() {
    setLoading(true)
    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factor: 'eastern_astrology', data: { birthYear, birthMonth }, profile }),
      })
      const data = await res.json()
      if (!data.results) throw new Error(data.error ?? 'No results returned')
      setResults(data.results)

      await supabase.from('identity_factors').update({
        discovery_completed: true,
        discovery_data: { birthYear, birthMonth },
        results: data.results,
      }).eq('user_id', userId).eq('factor_type', 'eastern_astrology')
    } catch (err) {
      console.error('Eastern astrology error:', err)
      alert('Something went wrong — please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="mb-6 inline-block" style={{ color: 'var(--text-muted)' }}><YinYang size={48} weight="thin" /></div>
        <p className="font-light" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-serif)' }}>
          Reading the celestial record...
        </p>
      </div>
    )
  }

  if (results) {
    return <EasternResults results={results} onContinue={onComplete} />
  }

  const currentYear = new Date().getFullYear()

  return (
    <motion.div className="flex flex-col gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase mb-3" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.2em', color: 'var(--text-muted)' }}>
      {children}
    </p>
  )
}

function EasternResults({ results, onContinue }: { results: EasternResults; onContinue: () => void }) {
  const yearQuality = results.year_2026?.relationship_quality ?? 'neutral'
  const yearColor = yearQuality === 'supportive'
    ? 'var(--sage)'
    : yearQuality === 'challenging'
    ? 'var(--terracotta)'
    : 'var(--text-muted)'
  const yearBg = yearQuality === 'supportive'
    ? 'rgba(95,123,78,0.1)'
    : yearQuality === 'challenging'
    ? 'rgba(238,108,90,0.1)'
    : 'var(--parchment)'

  return (
    <motion.div className="flex flex-col gap-6" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>

      {/* Header */}
      <div className="text-center">
        <div className="mb-3 flex justify-center" style={{ color: 'var(--text-secondary)' }}>
          <YinYang size={56} weight="thin" />
        </div>
        <h2 className="text-3xl font-semibold mb-1" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          {results.element} {results.animal}
        </h2>
        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{results.yin_yang}</p>
        {results.essence && (
          <p className="text-base italic font-light" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-serif)' }}>
            &ldquo;{results.essence}&rdquo;
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
        <p className="text-sm leading-relaxed font-light" style={{ color: 'var(--text-secondary)' }}>{results.summary}</p>
      </div>

      {/* Personality */}
      {results.personality && (
        <div className="flex flex-col gap-3">
          <SectionLabel>Who You Are</SectionLabel>
          <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
            <p className="text-sm leading-relaxed font-light mb-4" style={{ color: 'var(--text-secondary)' }}>
              {results.personality.core}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--cream)' }}>
                <p className="text-xs font-medium mb-1.5 uppercase" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>In Love</p>
                <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{results.personality.in_relationships}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--cream)' }}>
                <p className="text-xs font-medium mb-1.5 uppercase" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>At Work</p>
                <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{results.personality.at_work}</p>
              </div>
            </div>
            {results.personality.under_pressure && (
              <div className="mt-3 p-4 rounded-xl" style={{ backgroundColor: 'rgba(238,108,90,0.06)', borderLeft: '3px solid var(--terracotta)' }}>
                <p className="text-xs font-medium mb-1.5 uppercase" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', color: 'var(--terracotta)' }}>Under Pressure</p>
                <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{results.personality.under_pressure}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Strengths & Shadows */}
      {(results.strengths?.length || results.shadows?.length) && (
        <div className="flex flex-col gap-3">
          <SectionLabel>Strengths &amp; Shadows</SectionLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {results.strengths?.length > 0 && (
              <div className="p-5 rounded-2xl flex flex-col gap-2" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
                <p className="text-xs font-medium uppercase mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', color: 'var(--sage)' }}>Gifts</p>
                {results.strengths.map((s, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--sage)' }} />
                    <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{s}</p>
                  </div>
                ))}
              </div>
            )}
            {results.shadows?.length > 0 && (
              <div className="p-5 rounded-2xl flex flex-col gap-2" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
                <p className="text-xs font-medium uppercase mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>Growing Edges</p>
                {results.shadows.map((s, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--text-muted)' }} />
                    <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{s}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Element Nature */}
      {results.element_nature && (
        <div className="flex flex-col gap-3">
          <SectionLabel>The {results.element} Nature</SectionLabel>
          <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
            <p className="text-sm leading-relaxed font-light mb-3" style={{ color: 'var(--text-secondary)' }}>
              {results.element_nature.essence}
            </p>
            <p className="text-sm leading-relaxed font-light mb-4" style={{ color: 'var(--text-secondary)' }}>
              {results.element_nature.expression}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(95,123,78,0.08)' }}>
                <p className="text-xs font-medium mb-1 uppercase" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', color: 'var(--sage)' }}>Nourished by</p>
                <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{results.element_nature.nourished_by}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--cream)' }}>
                <p className="text-xs font-medium mb-1 uppercase" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>Depleted by</p>
                <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{results.element_nature.depleted_by}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2026 Year Reading */}
      {results.year_2026 && (
        <div className="flex flex-col gap-3">
          <SectionLabel>2026 — Year of the {results.year_2026.year_element} {results.year_2026.year_animal}</SectionLabel>
          <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
            {results.year_2026.relationship && (
              <span className="inline-block text-xs font-medium px-3 py-1 rounded-full mb-3 capitalize"
                style={{ backgroundColor: yearBg, color: yearColor, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
                {results.year_2026.relationship}
              </span>
            )}
            <p className="text-sm leading-relaxed font-light" style={{ color: 'var(--text-secondary)' }}>
              {results.year_2026.reading}
            </p>
          </div>
        </div>
      )}

      {/* CTA */}
      <motion.button
        onClick={onContinue}
        className="w-full py-4 rounded-xl text-white font-medium text-base"
        style={{ background: 'linear-gradient(135deg, var(--terracotta), var(--rust))' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}>
        <span className="flex items-center justify-center gap-2">
          <ArrowLeft size={16} weight="regular" /> Return to Dashboard
        </span>
      </motion.button>
    </motion.div>
  )
}
