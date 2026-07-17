'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FactorType, FACTOR_META, IdentityFactor } from '@/lib/types'

interface Props {
  factor: FactorType
  factorRow: IdentityFactor
  profile: { first_name: string; age: number; gender: string } | null
  userId: string
}

export default function DailyView({ factor, factorRow, profile }: Props) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const meta = FACTOR_META[factor]

  useEffect(() => {
    fetchDailyContent()
  }, [])

  async function fetchDailyContent() {
    setLoading(true)
    try {
      const res = await fetch('/api/daily-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factor, factorResults: factorRow.results, profile }),
      })
      const data = await res.json()
      setContent(data.factor_content ?? data.insight ?? '')
    } catch {
      setContent(getFallback(factor, factorRow.results as Record<string, unknown>))
    }
    setLoading(false)
  }

  const results = factorRow.results as Record<string, unknown>

  return (
    <motion.div className="flex flex-col gap-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      <div className="text-center">
        <div className="text-5xl mb-3">{meta.emoji}</div>
        <h2 className="text-2xl font-bold mb-1"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          {meta.label}
        </h2>
        <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Factor summary */}
      <FactorSnapshot factor={factor} results={results} />

      {/* Daily content */}
      <div className="p-6 rounded-2xl" style={{
        background: 'linear-gradient(135deg, var(--terracotta) 0%, var(--rust) 100%)'
      }}>
        <p className="text-xs text-white opacity-60 mb-3 tracking-widest uppercase">Today&apos;s Insight</p>
        {loading ? (
          <div className="flex flex-col gap-2">
            <div className="h-3 rounded-full bg-white opacity-20 animate-pulse w-3/4" />
            <div className="h-3 rounded-full bg-white opacity-20 animate-pulse w-full" />
            <div className="h-3 rounded-full bg-white opacity-20 animate-pulse w-2/3" />
          </div>
        ) : (
          <p className="text-white font-light leading-relaxed">{content}</p>
        )}
      </div>
    </motion.div>
  )
}

function FactorSnapshot({ factor, results }: { factor: FactorType; results: Record<string, unknown> }) {
  if (factor === 'western_astrology') {
    const r = results as { sun_sign?: string; moon_sign?: string; rising_sign?: string; summary?: string }
    return (
      <div className="p-6 rounded-2xl card-shadow" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
        <div className="flex gap-3 mb-4">
          {[{ e: '☀️', l: 'Sun', v: r.sun_sign }, { e: '🌙', l: 'Moon', v: r.moon_sign }, { e: '↑', l: 'Rising', v: r.rising_sign }]
            .map(a => (
              <div key={a.l} className="flex-1 text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--parchment)' }}>
                <div className="text-xl mb-1">{a.e}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.l}</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>{a.v}</div>
              </div>
            ))}
        </div>
        {r.summary && <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{r.summary}</p>}
      </div>
    )
  }

  if (factor === 'eastern_astrology') {
    const r = results as { animal?: string; element?: string; yin_yang?: string; summary?: string }
    return (
      <div className="p-6 rounded-2xl card-shadow text-center" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
        <div className="text-4xl mb-2">🐉</div>
        <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          {r.element} {r.animal}
        </h3>
        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{r.yin_yang}</p>
        {r.summary && <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{r.summary}</p>}
      </div>
    )
  }

  if (factor === 'spirituality') {
    const r = results as { traditions?: string[]; themes?: string[]; summary?: string }
    return (
      <div className="p-6 rounded-2xl card-shadow" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
        <div className="flex flex-wrap gap-2 mb-4">
          {(r.traditions ?? []).map(t => (
            <span key={t} className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ backgroundColor: 'rgba(122,158,126,0.15)', color: 'var(--sage)' }}>{t}</span>
          ))}
        </div>
        {r.summary && <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{r.summary}</p>}
      </div>
    )
  }

  if (factor === 'tarot') {
    const r = results as { cards?: { name: string; position: string; reversed?: boolean }[]; summary?: string }
    return (
      <div className="p-6 rounded-2xl card-shadow" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
        <div className="flex gap-3 mb-4">
          {(r.cards ?? []).map(c => (
            <div key={c.position} className="flex-1 text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--parchment)' }}>
              <div className="text-xl mb-1">🃏</div>
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{c.position}</div>
              <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>{c.name}</div>
            </div>
          ))}
        </div>
        {r.summary && <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{r.summary}</p>}
      </div>
    )
  }

  if (factor === 'values') {
    const r = results as { top_values?: string[]; summary?: string }
    return (
      <div className="p-6 rounded-2xl card-shadow" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
        <div className="flex flex-wrap gap-2 mb-4">
          {(r.top_values ?? []).map((v, i) => (
            <span key={v} className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ backgroundColor: i === 0 ? 'rgba(201,169,110,0.2)' : 'var(--parchment)', color: i === 0 ? 'var(--warm-brown)' : 'var(--text-secondary)' }}>
              {v}
            </span>
          ))}
        </div>
        {r.summary && <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{r.summary}</p>}
      </div>
    )
  }

  if (factor === 'ikigai') {
    const r = results as { ikigai_statement?: string }
    return (
      <div className="p-6 rounded-2xl card-shadow text-center" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
        <p className="text-xs font-medium mb-3 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Your Reason for Being</p>
        <p className="text-lg font-semibold italic" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          &ldquo;{r.ikigai_statement}&rdquo;
        </p>
      </div>
    )
  }

  return null
}

function getFallback(factor: FactorType, results: Record<string, unknown>): string {
  const snippets: Record<FactorType, string> = {
    western_astrology: `Your chart holds the blueprint of your becoming. Today, let one of your signs guide you.`,
    eastern_astrology: `The energy of your sign is with you today. Move in harmony with your nature.`,
    spirituality: `The traditions that resonate with you carry ancient wisdom. Let one thought from that well nourish you today.`,
    tarot: `Your cards spoke. Their message is still alive. What has unfolded since you drew them?`,
    values: `Your values are your compass. Today, notice one moment where you lived (or didn't live) by them.`,
    ikigai: `Your ikigai is not a destination — it is a practice. Today, do one small thing that touches all four circles.`,
  }
  return snippets[factor]
}
