'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Sun, Moon, ArrowUp, YinYang, Sparkle } from '@phosphor-icons/react'
import { FactorType, FACTOR_META, IdentityFactor } from '@/lib/types'
import { dateKeyToNoonUtc, addLocalDays } from '@/lib/localDate'
import { NatalChart } from '@/lib/natalChart'
import { createClient } from '@/lib/supabase/client'
import { getTarotCardImage } from '@/lib/tarotImages'
import FactorIcon from '@/components/FactorIcon'
import NatalChartWheel, { AspectsTable } from './NatalChart'
import IkigaiChart from './IkigaiChart'
import IkigaiReading from './IkigaiReading'
import { parseIkigaiReading, type IkigaiReading as IkigaiReadingSections } from '@/lib/ikigaiReading'
import { parseWesternAstrologyReading as parseWesternAstrologyJson } from '@/lib/structuredReading'
import BreathworkLoader, { InsightBreathworkCard, minBreathDelay } from './BreathworkLoader'

type TarotCard = { name: string; position: string; reversed?: boolean }

function formatDateKey(dateKey: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(dateKeyToNoonUtc(dateKey))
}

function tarotTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

function localTodayKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tarotTimezone(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function loadTarotRevealed(storageKey: string, count: number): Set<number> {
  try {
    if (localStorage.getItem(storageKey) === 'all') {
      return new Set(Array.from({ length: count }, (_, i) => i))
    }
  } catch { /* private browsing */ }
  return new Set()
}

function saveTarotRevealed(storageKey: string, revealed: Set<number>, total: number) {
  if (revealed.size < total) return
  try { localStorage.setItem(storageKey, 'all') } catch { /* private browsing */ }
}

interface Props {
  factor: FactorType
  factorRow: IdentityFactor
  profile: { first_name: string; age: number; gender: string } | null
  userId: string
}

export default function DailyView(props: Props) {
  if (props.factor === 'tarot') {
    return <TarotDailyView {...props} />
  }
  return <StandardDailyView {...props} />
}

function StandardDailyView({ factor, factorRow, profile, userId }: Props) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const meta = FACTOR_META[factor]
  const results = factorRow.results as Record<string, unknown>

  useEffect(() => {
    fetchDailyContent()
  }, [])

  async function fetchDailyContent(forceRefresh = false) {
    setLoading(true)
    const breath = minBreathDelay()

    const fetchContent = async (refresh = forceRefresh): Promise<string> => {
      const res = await fetch('/api/daily-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factor,
          factorResults: factorRow.results,
          profile,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...(refresh ? { forceRefresh: true } : {}),
        }),
      })
      if (!res.ok) throw new Error('Failed to load daily content')
      const data = await res.json()
      const text = data.factor_content ?? data.insight ?? ''

      if (factor === 'western_astrology' && !refresh && !parseWesternAstrologyJson(text)) {
        return fetchContent(true)
      }
      return text
    }

    try {
      const text = await fetchContent()
      await breath
      setContent(text)
    } catch {
      await breath
      setContent(getFallback(factor, results))
    }
    setLoading(false)
  }

  return (
    <motion.div className="flex flex-col gap-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      <DailyPageHeader factor={factor} meta={meta} />

      {factor === 'western_astrology' ? (
        <WesternAstrologyDailyInsight loading={loading} content={content} />
      ) : (
        <DailyInsight loading={loading} content={content} />
      )}

      <FactorSnapshot
        factor={factor}
        results={results}
        userId={userId}
        discoveryData={factorRow.discovery_data}
        profile={profile}
      />
    </motion.div>
  )
}

function TarotDailyView({ factorRow, profile }: Props) {
  const meta = FACTOR_META.tarot
  const results = factorRow.results as Record<string, unknown>

  return (
    <motion.div className="flex flex-col gap-8"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <DailyPageHeader factor="tarot" meta={meta} />
      <TarotDailySection factorRow={factorRow} profile={profile} />
      <TarotWeeklySection factorRow={factorRow} profile={profile} />
    </motion.div>
  )
}

function DailyPageHeader({ factor, meta }: { factor: FactorType; meta: typeof FACTOR_META[FactorType] }) {
  return (
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
  )
}

function TarotSectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center">
      <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
        {title}
      </p>
      {subtitle && (
        <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

function TarotCardBackButton({ onClick, disabled, label }: { onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-xl overflow-hidden transition-transform hover:scale-[1.02] disabled:opacity-60"
      style={{ width: 96, height: 168, backgroundColor: 'var(--sol-navy)', border: '1px solid rgba(255,255,255,0.15)' }}
      aria-label={label}
    >
      <div className="w-full h-full flex items-center justify-center">
        <Sparkle size={28} weight="thin" color="rgba(255,255,255,0.4)" />
      </div>
    </button>
  )
}

function TarotDailySection({ factorRow, profile }: {
  factorRow: IdentityFactor
  profile: { first_name: string; age: number; gender: string } | null
}) {
  const [cards, setCards] = useState<TarotCard[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [drawing, setDrawing] = useState(false)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [content, setContent] = useState('')
  const [readingLoading, setReadingLoading] = useState(false)

  const readyForReading = cards !== null && cards.length > 0 && revealed.size === cards.length

  const revealKey = `tarot_daily_${localTodayKey()}`

  useEffect(() => {
    let cancelled = false
    fetch('/api/daily-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor: 'tarot', tarotDashboard: true, timezone: tarotTimezone() }),
    })
      .then(res => { if (!res.ok) throw new Error('Failed to load daily card'); return res.json() })
      .then(data => {
        if (cancelled) return
        if (data.daily?.cards?.length) {
          setCards(data.daily.cards)
          setRevealed(loadTarotRevealed(revealKey, data.daily.cards.length))
        }
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [revealKey])

  useEffect(() => {
    if (!readyForReading) return
    let cancelled = false
    setReadingLoading(true)

    const breath = minBreathDelay()
    fetch('/api/daily-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        factor: 'tarot',
        factorResults: factorRow.results,
        profile,
        tarotSpread: 'single',
        timezone: tarotTimezone(),
      }),
    })
      .then(res => { if (!res.ok) throw new Error('Failed to load reading'); return res.json() })
      .then(async data => {
        await breath
        if (!cancelled) setContent(data.factor_content ?? '')
      })
      .catch(async () => {
        await breath
        if (!cancelled) setContent('Your card holds a message for today. Sit with what arises.')
      })
      .finally(() => { if (!cancelled) setReadingLoading(false) })

    return () => { cancelled = true }
  }, [readyForReading, factorRow.results, profile])

  async function drawDaily() {
    setDrawing(true)
    try {
      const res = await fetch('/api/daily-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factor: 'tarot', cardsOnly: true, tarotSpread: 'single', timezone: tarotTimezone() }),
      })
      if (!res.ok) throw new Error('Failed to draw daily card')
      const data = await res.json()
      setCards(data.cards ?? [])
      setRevealed(new Set())
      setContent('')
      try { localStorage.removeItem(revealKey) } catch { /* private browsing */ }
    } catch {
      setCards(null)
    }
    setDrawing(false)
  }

  return (
    <section className="flex flex-col gap-4 pb-8 border-b" style={{ borderColor: 'var(--parchment)' }}>
      <TarotSectionHeader
        title="Daily"
        subtitle="One card drawn for today — a focused message to sit with."
      />

      {loading ? (
        <div className="flex justify-center">
          <div className="rounded-xl animate-pulse" style={{ width: 96, height: 168, backgroundColor: 'var(--parchment)' }} />
        </div>
      ) : cards ? (
        <>
          <TarotCardReveal
            cards={cards}
            revealed={revealed}
            onReveal={i => setRevealed(prev => {
              const next = new Set(prev).add(i)
              saveTarotRevealed(revealKey, next, cards.length)
              return next
            })}
          />
          {revealed.size < cards.length && (
            <p className="text-sm font-light text-center" style={{ color: 'var(--text-muted)' }}>
              Tap the card to reveal it and unlock today&apos;s reading.
            </p>
          )}
          {readyForReading && <TarotDailyInsight loading={readingLoading} content={content} />}
        </>
      ) : (
        <>
          <div className="flex justify-center">
            <TarotCardBackButton onClick={drawDaily} disabled={drawing} label="Draw today's card" />
          </div>
          <button
            type="button"
            onClick={drawDaily}
            disabled={drawing}
            className="text-sm font-medium mx-auto disabled:opacity-60"
            style={{ color: 'var(--text-primary)' }}
          >
            {drawing ? 'Drawing…' : 'Draw today\'s card'}
          </button>
        </>
      )}
    </section>
  )
}

function TarotWeeklySection({ factorRow, profile }: {
  factorRow: IdentityFactor
  profile: { first_name: string; age: number; gender: string } | null
}) {
  const [weeklyCards, setWeeklyCards] = useState<TarotCard[] | null>(null)
  const [drawnAt, setDrawnAt] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [drawing, setDrawing] = useState(false)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [content, setContent] = useState('')
  const [readingLoading, setReadingLoading] = useState(false)

  const revealKey = drawnAt ? `tarot_weekly_${drawnAt}` : null
  const readyForReading = weeklyCards !== null && weeklyCards.length > 0 && revealed.size === weeklyCards.length

  useEffect(() => {
    let cancelled = false
    fetch('/api/daily-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor: 'tarot', tarotDashboard: true, timezone: tarotTimezone() }),
    })
      .then(res => { if (!res.ok) throw new Error('Failed to load weekly cards'); return res.json() })
      .then(data => {
        if (cancelled) return
        if (data.weekly?.cards?.length) {
          setWeeklyCards(data.weekly.cards)
          setDrawnAt(data.weekly.drawnAt ?? null)
          setExpiresAt(data.weekly.expiresAt ?? null)
          const key = `tarot_weekly_${data.weekly.drawnAt}`
          setRevealed(loadTarotRevealed(key, data.weekly.cards.length))
          if (data.weekly.content) setContent(data.weekly.content)
        }
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!readyForReading || content) return
    let cancelled = false
    setReadingLoading(true)

    const breath = minBreathDelay()
    fetch('/api/daily-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        factor: 'tarot',
        factorResults: factorRow.results,
        profile,
        tarotSpread: 'weekly',
        timezone: tarotTimezone(),
      }),
    })
      .then(res => { if (!res.ok) throw new Error('Failed to load weekly reading'); return res.json() })
      .then(async data => {
        await breath
        if (!cancelled) setContent(data.factor_content ?? '')
      })
      .catch(async () => {
        await breath
        if (!cancelled) setContent('Your weekly spread holds a message for the days ahead. Sit with what arises.')
      })
      .finally(() => { if (!cancelled) setReadingLoading(false) })

    return () => { cancelled = true }
  }, [readyForReading, content, factorRow.results, profile])

  async function drawWeekly() {
    setDrawing(true)
    try {
      const res = await fetch('/api/daily-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factor: 'tarot', weeklyCardsOnly: true, timezone: tarotTimezone() }),
      })
      if (!res.ok) throw new Error('Failed to draw weekly cards')
      const data = await res.json()
      setWeeklyCards(data.cards ?? [])
      setDrawnAt(data.drawnAt ?? null)
      setExpiresAt(data.expiresAt ?? null)
      setRevealed(new Set())
      setContent('')
      if (data.drawnAt) {
        try { localStorage.removeItem(`tarot_weekly_${data.drawnAt}`) } catch { /* private browsing */ }
      }
    } catch {
      setWeeklyCards(null)
      setDrawnAt(null)
      setExpiresAt(null)
    }
    setDrawing(false)
  }

  const activeUntil = expiresAt
    ? formatDateKey(addLocalDays(expiresAt, -1, tarotTimezone()))
    : null

  return (
    <section className="flex flex-col gap-4">
      <TarotSectionHeader
        title="Weekly"
        subtitle="Three cards for the week ahead — Theme, Focus, and Invitation."
      />

      {loading ? (
        <div className="flex justify-center gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="rounded-xl animate-pulse" style={{ width: 96, height: 168, backgroundColor: 'var(--parchment)' }} />
          ))}
        </div>
      ) : weeklyCards ? (
        <>
          {activeUntil && (
            <p className="text-xs font-light text-center" style={{ color: 'var(--text-muted)' }}>
              Active through {activeUntil}
            </p>
          )}
          <TarotCardReveal
            cards={weeklyCards}
            revealed={revealed}
            onReveal={i => setRevealed(prev => {
              const next = new Set(prev).add(i)
              if (revealKey) saveTarotRevealed(revealKey, next, weeklyCards.length)
              return next
            })}
          />
          {revealed.size < weeklyCards.length && (
            <p className="text-sm font-light text-center" style={{ color: 'var(--text-muted)' }}>
              Tap each card to reveal it and unlock this week&apos;s reading.
            </p>
          )}
          {readyForReading && (
            <TarotWeeklyInsight loading={readingLoading} content={content} />
          )}
        </>
      ) : (
        <>
          <div className="flex justify-center gap-4">
            {Array.from({ length: 3 }, (_, i) => (
              <TarotCardBackButton key={i} onClick={drawWeekly} disabled={drawing} label="Draw weekly tarot card" />
            ))}
          </div>
          <button
            type="button"
            onClick={drawWeekly}
            disabled={drawing}
            className="text-sm font-medium mx-auto disabled:opacity-60"
            style={{ color: 'var(--text-primary)' }}
          >
            {drawing ? 'Drawing…' : 'Draw this week\'s cards'}
          </button>
        </>
      )}
    </section>
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
          <div key={`${c.position}-${i}`} className="flex flex-col items-center gap-2">
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
                <div className="absolute inset-0 rounded-xl flex items-center justify-center"
                  style={{
                    backfaceVisibility: 'hidden',
                    backgroundColor: 'var(--sol-navy)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}>
                  <Sparkle size={28} weight="thin" color="rgba(255,255,255,0.4)" />
                </div>

                {/* Card face — no rounding; RWS artwork includes its own border */}
                <div className="absolute inset-0"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  {img ? (
                    <Image src={img} alt={c.name} fill sizes="96px" className="object-contain"
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
  if (loading) return <InsightBreathworkCard />

  return (
    <div className="p-6" style={{ backgroundColor: 'var(--sol-navy)' }}>
      <p className="text-xs text-white opacity-60 mb-3 tracking-widest uppercase">Today&apos;s Insight</p>
      <p className="text-white font-light leading-relaxed">{content}</p>
    </div>
  )
}

type StructuredDailyReading = {
  headline?: string
  items: { label: string; reflection: string }[]
  summary: string
}

function parseStructuredReading(
  content: string,
  itemsKey: 'cards' | 'aspects'
): StructuredDailyReading | null {
  if (itemsKey === 'aspects') {
    const reading = parseWesternAstrologyJson(content)
    if (!reading) return null
    return { headline: reading.headline, items: reading.aspects, summary: reading.summary }
  }

  try {
    const parsed = JSON.parse(content)
    const items = parsed?.[itemsKey]
    if (parsed?.summary && Array.isArray(items)) {
      return { headline: parsed.headline, items, summary: parsed.summary }
    }
  } catch {
    // not JSON — fall through to raw-text rendering
  }
  return null
}

function parseTarotReading(content: string): StructuredDailyReading | null {
  try {
    const parsed = JSON.parse(content)
    if (parsed?.summary && Array.isArray(parsed?.cards)) {
      return {
        items: parsed.cards.map((c: { position: string; reflection: string }) => ({
          label: c.position,
          reflection: c.reflection,
        })),
        summary: parsed.summary,
      }
    }
  } catch {
    // not JSON — fall through to raw-text rendering
  }
  return null
}

function StructuredDailyInsight({
  loading,
  content,
  parse,
  label = "Today's Insight",
}: {
  loading: boolean
  content: string
  parse: (content: string) => StructuredDailyReading | null
  label?: string
}) {
  const reading = !loading ? parse(content) : null

  if (loading) return <InsightBreathworkCard />

  return (
    <div className="p-6" style={{ backgroundColor: 'var(--sol-navy)' }}>
      <p className="text-xs text-white opacity-60 mb-3 tracking-widest uppercase">{label}</p>
      {reading ? (
        <div className="flex flex-col gap-4">
          {reading.headline && (
            <p className="text-white font-normal leading-snug" style={{ fontFamily: 'var(--font-serif)' }}>
              {reading.headline}
            </p>
          )}
          <ul className="flex flex-col gap-3">
            {reading.items.map(item => (
              <li key={item.label} className="flex gap-2 items-start">
                <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0 bg-white opacity-50" />
                <p className="text-white font-light leading-relaxed">
                  <span className="font-normal opacity-80">{item.label}:</span> {item.reflection}
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

function TarotDailyInsight({ loading, content }: { loading: boolean; content: string }) {
  return <StructuredDailyInsight loading={loading} content={content} parse={parseTarotReading} />
}

function TarotWeeklyInsight({ loading, content }: { loading: boolean; content: string }) {
  return (
    <StructuredDailyInsight
      loading={loading}
      content={content}
      parse={parseTarotReading}
      label="This Week's Reading"
    />
  )
}

function SkyEventsBox({ events }: { events: { title: string; timing: string; impact: string }[] }) {
  return (
    <div
      className="p-5 rounded-xl border"
      style={{ backgroundColor: 'var(--warm-white)', borderColor: 'var(--parchment)' }}
    >
      <p
        className="text-xs mb-4 tracking-widest uppercase font-medium"
        style={{ color: 'var(--text-muted)' }}
      >
        On the Horizon
      </p>
      <div className="flex flex-col gap-4">
        {events.map(event => (
          <div
            key={`${event.timing}:${event.title}`}
            className="pb-4 last:pb-0 last:border-0 border-b"
            style={{ borderColor: 'var(--parchment)' }}
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-2">
              <p
                className="text-base font-normal"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
              >
                {event.title}
              </p>
              <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--terracotta)' }}>
                {event.timing}
              </span>
            </div>
            <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {event.impact}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function WesternAstrologyDailyInsight({ loading, content }: { loading: boolean; content: string }) {
  if (loading) return <InsightBreathworkCard />

  const reading = parseWesternAstrologyJson(content)

  return (
    <div className="flex flex-col gap-4">
      {reading?.events && reading.events.length > 0 && <SkyEventsBox events={reading.events} />}
      <StructuredDailyInsight
        loading={false}
        content={content}
        parse={c => parseStructuredReading(c, 'aspects')}
      />
    </div>
  )
}

function FactorSnapshot({
  factor,
  results,
  userId,
  discoveryData,
  profile,
}: {
  factor: FactorType
  results: Record<string, unknown>
  userId: string
  discoveryData?: Record<string, unknown>
  profile?: { first_name: string; age: number; gender: string } | null
}) {
  if (factor === 'western_astrology') {
    const r = results as { sun_sign?: string; moon_sign?: string; rising_sign?: string; summary?: string; chart?: NatalChart }
    return (
      <div className="flex flex-col gap-4">
        <div className="p-6" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
          <div className="flex gap-3 mb-4">
            {[{ icon: <Sun size={20} weight="thin" />, l: 'Sun', v: r.sun_sign }, { icon: <Moon size={20} weight="thin" />, l: 'Moon', v: r.moon_sign }, { icon: <ArrowUp size={20} weight="thin" />, l: 'Rising', v: r.rising_sign }]
              .map(a => (
                <div key={a.l} className="flex-1 text-center p-3" style={{ backgroundColor: 'var(--parchment)' }}>
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
            <div className="p-4" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
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
    const yearColor = yearQuality === 'supportive' ? 'var(--status-supportive)' : yearQuality === 'challenging' ? 'var(--status-challenging)' : 'var(--status-neutral)'
    const yearBg = yearQuality === 'supportive' ? 'color-mix(in srgb, var(--status-supportive) 10%, var(--warm-white))' : yearQuality === 'challenging' ? 'color-mix(in srgb, var(--status-challenging) 10%, var(--warm-white))' : 'var(--parchment)'
    return (
      <div className="flex flex-col gap-3">
        <div className="p-5 text-center" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
          <div className="mb-2 flex justify-center" style={{ color: 'var(--text-secondary)' }}><YinYang size={36} weight="thin" /></div>
          <h3 className="text-xl font-semibold mb-0.5" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
            {r.element} {r.animal}
          </h3>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{r.yin_yang}</p>
          {r.essence && <p className="text-sm italic font-light mb-3" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-serif)' }}>&ldquo;{r.essence}&rdquo;</p>}
          {r.summary && <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{r.summary}</p>}
        </div>
        {r.strengths && r.strengths.length > 0 && (
          <div className="p-4" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
            <p className="text-xs font-medium uppercase mb-2" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', color: 'var(--text-primary)' }}>Your Gifts</p>
            <div className="flex flex-col gap-1.5">
              {r.strengths.slice(0, 3).map((s, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--text-primary)' }} />
                  <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{s}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {r.year_2026?.reading && (
          <div className="p-4" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
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
      <div className="p-6" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
        <div className="flex flex-wrap gap-2 mb-4">
          {(r.traditions ?? []).map(t => (
            <span key={t} className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ backgroundColor: 'var(--selected-bg)', color: 'var(--text-primary)' }}>{t}</span>
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
      <div className="p-6" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
        <div className="flex flex-wrap gap-2 mb-4">
          {(r.top_values ?? []).map((v, i) => (
            <span key={v} className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ backgroundColor: i === 0 ? 'var(--selected-bg)' : 'var(--parchment)', color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {v}
            </span>
          ))}
        </div>
        {r.summary && <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>{r.summary}</p>}
      </div>
    )
  }

  if (factor === 'ikigai') {
    return (
      <IkigaiSnapshot
        results={results}
        userId={userId}
        discoveryData={discoveryData}
        profile={profile}
      />
    )
  }

  return null
}

function IkigaiSnapshot({
  results,
  userId,
  discoveryData,
  profile,
}: {
  results: Record<string, unknown>
  userId: string
  discoveryData?: Record<string, unknown>
  profile?: { first_name: string; age: number; gender: string } | null
}) {
  const r = results as { ikigai_statement?: string; reading?: unknown }
  const [reading, setReading] = useState<IkigaiReadingSections | null>(() => parseIkigaiReading(r.reading))
  const [readingLoading, setReadingLoading] = useState(!parseIkigaiReading(r.reading))
  const supabase = createClient()

  useEffect(() => {
    if (parseIkigaiReading(r.reading)) return

    let cancelled = false

    async function backfill() {
      setReadingLoading(true)
      try {
        const res = await fetch('/api/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            factor: 'ikigai',
            backfillReading: true,
            profile,
            data: { ...results, discovery_data: discoveryData },
          }),
        })
        const data = await res.json()
        const parsed = parseIkigaiReading(data.reading)
        if (!parsed || cancelled) return

        setReading(parsed)
        await supabase.from('identity_factors').update({
          results: { ...results, reading: parsed },
        }).eq('user_id', userId).eq('factor_type', 'ikigai')
      } catch {
        /* reading stays null */
      } finally {
        if (!cancelled) setReadingLoading(false)
      }
    }

    backfill()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="p-6 text-center" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
        <p className="text-xs font-medium mb-3 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Your Reason for Being</p>
        <p className="text-lg font-normal leading-relaxed" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          &ldquo;{r.ikigai_statement}&rdquo;
        </p>
      </div>
      <div className="px-4 py-6 flex justify-center" style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
        <IkigaiChart size={340} linkToReading />
      </div>
      <IkigaiReading reading={reading} loading={readingLoading} />
    </div>
  )
}

function getFallback(factor: FactorType, results: Record<string, unknown>): string {
  const snippets: Record<FactorType, string> = {
    western_astrology: JSON.stringify({
      headline: 'The sky is speaking through your chart today',
      aspects: [{ label: 'Your natal chart', reflection: 'Your chart holds the blueprint of your becoming.' }],
      summary: 'Today, let one of your signs guide you inward.',
      events: [],
    }),
    eastern_astrology: `The energy of your sign is with you today. Move in harmony with your nature.`,
    spirituality: `The traditions that resonate with you carry ancient wisdom. Let one thought from that well nourish you today.`,
    tarot: `Your cards spoke. Their message is still alive. What has unfolded since you drew them?`,
    values: `Your values are your compass. Today, notice one moment where you lived (or didn't live) by them.`,
    ikigai: `Your ikigai is not a destination — it is a practice. Today, do one small thing that touches all four circles.`,
  }
  return snippets[factor]
}
