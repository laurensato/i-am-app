'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Sun, Moon, ArrowUp, YinYang, Sparkle } from '@phosphor-icons/react'
import { FactorType, FACTOR_META, IdentityFactor } from '@/lib/types'
import { NatalChart } from '@/lib/natalChart'
import { createClient } from '@/lib/supabase/client'
import { getTarotCardImage } from '@/lib/tarotImages'
import FactorIcon from '@/components/FactorIcon'
import NatalChartWheel, { AspectsTable } from './NatalChart'
import IkigaiChart from './IkigaiChart'

type TarotCard = { name: string; position: string; reversed?: boolean }

interface Props {
  factor: FactorType
  factorRow: IdentityFactor
  profile: { first_name: string; age: number; gender: string } | null
  userId: string
}

export default function DailyView({ factor, factorRow, profile, userId }: Props) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const meta = FACTOR_META[factor]
  const results = factorRow.results as Record<string, unknown>

  const isTarot = factor === 'tarot'
  // Tarot draws fresh each day (server-decided, cached for the day) rather than reusing the
  // cards from the original discovery draw — fetched separately so the flip cards can render
  // before the reading itself is generated.
  const [todaysCards, setTodaysCards] = useState<TarotCard[] | null>(null)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const cards = todaysCards ?? []
  const cardsLoaded = !isTarot || todaysCards !== null
  const readyForReading = !isTarot || (cardsLoaded && cards.length > 0 && revealed.size === cards.length)

  useEffect(() => {
    if (!isTarot) return
    let cancelled = false
    fetch('/api/daily-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor: 'tarot', cardsOnly: true }),
    })
      .then(res => { if (!res.ok) throw new Error('Failed to load today’s cards'); return res.json() })
      .then(data => { if (!cancelled) setTodaysCards(data.cards ?? []) })
      .catch(() => { if (!cancelled) setTodaysCards([]) })
    return () => { cancelled = true }
  }, [isTarot])

  useEffect(() => {
    if (!readyForReading) return
    fetchDailyContent()
  }, [readyForReading])

  async function fetchDailyContent() {
    setLoading(true)
    try {
      const res = await fetch('/api/daily-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factor, factorResults: factorRow.results, profile }),
      })
      if (!res.ok) throw new Error('Failed to load daily content')
      const data = await res.json()
      setContent(data.factor_content ?? data.insight ?? '')
    } catch {
      setContent(getFallback(factor, results))
    }
    setLoading(false)
  }

  return (
    <motion.div className="flex flex-col gap-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      <div className="text-center">
        <div className="mb-3 flex justify-center" style={{ color: 'var(--text-secondary)' }}>
          <FactorIcon factor={factor} size={48} weight="thin" />
        </div>
        <h2 className="text-2xl font-bold mb-1"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          {meta.label}
        </h2>
        <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {isTarot && !cardsLoaded && (
        <div className="flex justify-center gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-xl animate-pulse" style={{ width: 96, height: 168, backgroundColor: 'var(--parchment)' }} />
          ))}
        </div>
      )}

      {isTarot && cardsLoaded && (
        <TarotCardReveal
          cards={cards}
          revealed={revealed}
          onReveal={i => setRevealed(prev => new Set(prev).add(i))}
        />
      )}

      {isTarot && !cardsLoaded ? null : isTarot && !readyForReading ? (
        <p className="text-sm font-light text-center" style={{ color: 'var(--text-muted)' }}>
          Tap each card to reveal it and unlock today&apos;s reading.
        </p>
      ) : isTarot ? (
        <TarotDailyInsight loading={loading} content={content} />
      ) : (
        <DailyInsight loading={loading} content={content} />
      )}

      {/* Factor summary */}
      <FactorSnapshot factor={factor} results={results} userId={userId} />
    </motion.div>
  )
}

function TarotCardReveal({ cards, revealed, onReveal }: {
  cards: TarotCard[]
  revealed: Set<number>
  onReveal: (i: number) => void
}) {
  return (
    <div className="flex justify-center gap-4">
      {cards.map((c, i) => {
        const isRevealed = revealed.has(i)
        const img = getTarotCardImage(c.name)
        return (
          <div key={c.position} className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => !isRevealed && onReveal(i)}
              disabled={isRevealed}
              aria-label={isRevealed ? c.name : `Reveal ${c.position} card`}
              style={{ width: 96, height: 168, perspective: 800, cursor: isRevealed ? 'default' : 'pointer' }}
            >
              <motion.div
                className="relative w-full h-full"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: isRevealed ? 180 : 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                whileHover={!isRevealed ? { scale: 1.04 } : {}}
                whileTap={!isRevealed ? { scale: 0.97 } : {}}
              >
                {/* Card back */}
                <div className="absolute inset-0 rounded-xl flex items-center justify-center card-shadow"
                  style={{
                    backfaceVisibility: 'hidden',
                    background: 'linear-gradient(135deg, var(--sol-navy), var(--warm-brown))',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}>
                  <Sparkle size={28} weight="thin" color="rgba(255,255,255,0.4)" />
                </div>

                {/* Card face */}
                <div className="absolute inset-0 rounded-xl overflow-hidden card-shadow"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  {img ? (
                    <Image src={img} alt={c.name} fill sizes="96px" className="object-cover"
                      style={{ transform: c.reversed ? 'rotate(180deg)' : 'none' }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-center p-2"
                      style={{ backgroundColor: 'var(--parchment)' }}>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.name}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </button>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{c.position}</p>
              {isRevealed && (
                <p className="text-xs font-normal mt-0.5" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                  {c.name}{c.reversed ? ' (Reversed)' : ''}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DailyInsight({ loading, content }: { loading: boolean; content: string }) {
  return (
    <div className="p-6 rounded-2xl" style={{
      backgroundColor: 'var(--sol-navy)'
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
  )
}

function parseTarotReading(content: string): { cards: { position: string; reflection: string }[]; summary: string } | null {
  try {
    const parsed = JSON.parse(content)
    if (parsed?.summary && Array.isArray(parsed?.cards)) return parsed
  } catch {
    // not JSON — fall through to raw-text rendering
  }
  return null
}

function TarotDailyInsight({ loading, content }: { loading: boolean; content: string }) {
  const reading = !loading ? parseTarotReading(content) : null

  return (
    <div className="p-6 rounded-2xl" style={{ backgroundColor: 'var(--sol-navy)' }}>
      <p className="text-xs text-white opacity-60 mb-3 tracking-widest uppercase">Today&apos;s Insight</p>
      {loading ? (
        <div className="flex flex-col gap-2">
          <div className="h-3 rounded-full bg-white opacity-20 animate-pulse w-3/4" />
          <div className="h-3 rounded-full bg-white opacity-20 animate-pulse w-full" />
          <div className="h-3 rounded-full bg-white opacity-20 animate-pulse w-2/3" />
        </div>
      ) : reading ? (
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-3">
            {reading.cards.map(c => (
              <li key={c.position} className="flex gap-2 items-start">
                <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0 bg-white opacity-50" />
                <p className="text-white font-light leading-relaxed">
                  <span className="font-normal opacity-80">{c.position}:</span> {c.reflection}
                </p>
              </li>
            ))}
          </ul>
          <p className="text-white font-light leading-relaxed pt-4 border-t border-white border-opacity-20">
            {reading.summary}
          </p>
        </div>
      ) : (
        <p className="text-white font-light leading-relaxed">{content}</p>
      )}
    </div>
  )
}

function FactorSnapshot({ factor, results, userId }: { factor: FactorType; results: Record<string, unknown>; userId: string }) {
  if (factor === 'western_astrology') {
    const r = results as { sun_sign?: string; moon_sign?: string; rising_sign?: string; summary?: string; chart?: NatalChart }
    return (
      <div className="flex flex-col gap-4">
        <div className="p-6 rounded-2xl card-shadow" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
          <div className="flex gap-3 mb-4">
            {[{ icon: <Sun size={20} weight="thin" />, l: 'Sun', v: r.sun_sign }, { icon: <Moon size={20} weight="thin" />, l: 'Moon', v: r.moon_sign }, { icon: <ArrowUp size={20} weight="thin" />, l: 'Rising', v: r.rising_sign }]
              .map(a => (
                <div key={a.l} className="flex-1 text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--parchment)' }}>
                  <div className="mb-1 flex justify-center" style={{ color: 'var(--text-secondary)' }}>{a.icon}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.l}</div>
                  <div className="text-sm font-normal" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>{a.v}</div>
                </div>
              ))}
          </div>
          {r.summary && <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{r.summary}</p>}
        </div>

        {r.chart ? (
          <>
            <div className="p-4 rounded-2xl card-shadow" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
              <NatalChartWheel chart={r.chart} />
            </div>
            <div>
              <p className="text-xs font-medium mb-2 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                Aspects
              </p>
              <AspectsTable chart={r.chart} />
            </div>
          </>
        ) : (
          <p className="text-xs font-light text-center" style={{ color: 'var(--text-muted)' }}>
            Full chart not available for this reading — use &ldquo;Update my intake&rdquo; below to generate one.
          </p>
        )}
      </div>
    )
  }

  if (factor === 'eastern_astrology') {
    const r = results as {
      animal?: string; element?: string; yin_yang?: string; summary?: string; essence?: string
      strengths?: string[]
      year_2026?: { year_animal?: string; year_element?: string; relationship?: string; relationship_quality?: string; reading?: string }
    }
    const yearQuality = r.year_2026?.relationship_quality
    const yearColor = yearQuality === 'supportive' ? 'var(--sage)' : yearQuality === 'challenging' ? 'var(--terracotta)' : 'var(--text-muted)'
    const yearBg = yearQuality === 'supportive' ? 'rgba(95,123,78,0.1)' : yearQuality === 'challenging' ? 'rgba(238,108,90,0.1)' : 'var(--parchment)'
    return (
      <div className="flex flex-col gap-3">
        <div className="p-5 rounded-2xl card-shadow text-center" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
          <div className="mb-2 flex justify-center" style={{ color: 'var(--text-secondary)' }}><YinYang size={36} weight="thin" /></div>
          <h3 className="text-xl font-semibold mb-0.5" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
            {r.element} {r.animal}
          </h3>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{r.yin_yang}</p>
          {r.essence && <p className="text-sm italic font-light mb-3" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-serif)' }}>&ldquo;{r.essence}&rdquo;</p>}
          {r.summary && <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{r.summary}</p>}
        </div>
        {r.strengths && r.strengths.length > 0 && (
          <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
            <p className="text-xs font-medium uppercase mb-2" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', color: 'var(--sage)' }}>Your Gifts</p>
            <div className="flex flex-col gap-1.5">
              {r.strengths.slice(0, 3).map((s, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--sage)' }} />
                  <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{s}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {r.year_2026?.reading && (
          <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-medium uppercase" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>
                2026 — {r.year_2026.year_element} {r.year_2026.year_animal}
              </p>
              {r.year_2026.relationship && (
                <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: yearBg, color: yearColor }}>
                  {r.year_2026.relationship}
                </span>
              )}
            </div>
            <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{r.year_2026.reading}</p>
          </div>
        )}
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
              style={{ backgroundColor: 'rgba(95,123,78,0.15)', color: 'var(--sage)' }}>{t}</span>
          ))}
        </div>
        {r.summary && <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{r.summary}</p>}
      </div>
    )
  }

  if (factor === 'tarot') {
    // The original discovery-time reading is a fixed interpretation of whatever cards were
    // drawn at onboarding. Now that the daily view draws fresh cards every day, showing that
    // permanent reading alongside a different daily draw would never look connected — the flip
    // cards and today's insight above are the full reading now, so there's nothing else to show.
    return null
  }

  if (factor === 'values') {
    const r = results as { top_values?: string[]; summary?: string }
    return (
      <div className="p-6 rounded-2xl card-shadow" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
        <div className="flex flex-wrap gap-2 mb-4">
          {(r.top_values ?? []).map((v, i) => (
            <span key={v} className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ backgroundColor: i === 0 ? 'rgba(238,108,90,0.2)' : 'var(--parchment)', color: i === 0 ? 'var(--warm-brown)' : 'var(--text-secondary)' }}>
              {v}
            </span>
          ))}
        </div>
        {r.summary && <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{r.summary}</p>}
      </div>
    )
  }

  if (factor === 'ikigai') {
    return <IkigaiSnapshot results={results} userId={userId} />
  }

  return null
}

function IkigaiSnapshot({ results, userId }: { results: Record<string, unknown>; userId: string }) {
  const r = results as {
    ikigai_statement?: string; love?: string[]; good_at?: string[]; world_needs?: string[]; paid_for?: string[]; essence?: string
  }
  const [word, setWord] = useState<string | null>(r.essence ?? null)
  const supabase = createClient()

  useEffect(() => {
    if (word || !r.ikigai_statement) return
    let cancelled = false
    fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor: 'ikigai', backfillEssence: true, data: r }),
    })
      .then(res => res.json())
      .then(async data => {
        if (cancelled || !data.essence) return
        setWord(data.essence)
        await supabase.from('identity_factors')
          .update({ results: { ...r, essence: data.essence } })
          .eq('user_id', userId).eq('factor_type', 'ikigai')
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="p-6 rounded-2xl card-shadow text-center" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
        <p className="text-xs font-medium mb-3 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Your Reason for Being</p>
        <p className="text-lg font-normal italic" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          &ldquo;{r.ikigai_statement}&rdquo;
        </p>
      </div>
      <div className="p-4 rounded-2xl card-shadow" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
        <IkigaiChart word={word} love={r.love} good_at={r.good_at} world_needs={r.world_needs} paid_for={r.paid_for} size={340} />
      </div>
    </div>
  )
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
