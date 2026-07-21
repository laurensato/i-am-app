'use client'
import { useState, useEffect, createElement } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Sun, Moon, ArrowUp, Sparkle, ArrowRight } from '@phosphor-icons/react'
import { FactorType, FACTOR_META, IdentityFactor, UserProfile } from '@/lib/types'
import { getTarotCardImage } from '@/lib/tarotImages'
import { getZodiacAnimalIcon, getZodiacElementIcon } from '@/lib/zodiacIcons'
import FactorIcon from '@/components/FactorIcon'
import RotatingBackground from '@/components/RotatingBackground'

interface Props {
  profile: UserProfile
  factors: IdentityFactor[]
  dailyMessage: { insight: string; mantra: string } | null
  userId: string
}

export default function DashboardClient({ profile, factors, dailyMessage: initialMessage, userId }: Props) {
  const router = useRouter()
  const [dailyMessage, setDailyMessage] = useState(initialMessage)
  const [loadingMessage, setLoadingMessage] = useState(!initialMessage)
  const supabase = createClient()

  useEffect(() => {
    if (!initialMessage) {
      fetchDailyMessage()
    }
  }, [])

  async function fetchDailyMessage() {
    setLoadingMessage(true)
    try {
      const res = await fetch('/api/daily-message', { method: 'POST' })
      const data = await res.json()
      setDailyMessage(data)
    } catch {
      setDailyMessage({ insight: 'Take a breath. You are enough.', mantra: 'I am becoming.' })
    }
    setLoadingMessage(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const completedFactors = factors.filter(f => f.discovery_completed)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <main className="min-h-screen pb-20" style={{ backgroundColor: 'var(--cream)' }}>
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between border-b"
        style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)' }}>
        <h1 className="text-2xl font-normal tracking-wider" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          I AM
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>{profile.first_name}</span>
          <button onClick={handleSignOut} className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-8 flex flex-col gap-8">

        {/* Daily message */}
        <motion.section
          className="rounded-3xl p-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--moss) 0%, var(--forest) 100%)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-4 right-6 opacity-20 text-white"><Sparkle size={56} weight="thin" /></div>
          <p className="text-sm font-light text-white opacity-70 mb-4">{today}</p>

          {loadingMessage ? (
            <div className="flex flex-col gap-3">
              <div className="h-4 rounded-full bg-white opacity-20 animate-pulse w-3/4" />
              <div className="h-4 rounded-full bg-white opacity-20 animate-pulse w-full" />
              <div className="h-4 rounded-full bg-white opacity-20 animate-pulse w-2/3" />
            </div>
          ) : (
            <>
              <p className="text-white text-lg leading-relaxed mb-6 font-light">
                {dailyMessage?.insight}
              </p>
              <div className="border-t border-white border-opacity-20 pt-4">
                <p className="text-xs text-white opacity-60 mb-1 tracking-widest uppercase">Today&apos;s Mantra</p>
                <p className="text-white font-medium text-xl italic" style={{ fontFamily: 'var(--font-serif)' }}>
                  &ldquo;{dailyMessage?.mantra}&rdquo;
                </p>
              </div>
            </>
          )}
        </motion.section>

        {/* Identity factor cards */}
        <section className="relative overflow-hidden rounded-3xl p-4 sm:p-6">
          <RotatingBackground />

          <div className="relative">
          <h2 className="text-xl font-normal mb-4" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
            Your Identity Map
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {factors.map((factor, i) => {
              const meta = FACTOR_META[factor.factor_type as FactorType]
              const completed = factor.discovery_completed
              return (
                <motion.div
                  key={factor.factor_type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <Link href={`/discover/${factor.factor_type}`}>
                    <motion.div
                      className="rounded-2xl p-6 border cursor-pointer transition-all card-shadow card-shadow-hover"
                      style={{
                        backgroundColor: 'var(--warm-white)',
                        borderColor: completed ? 'var(--gold)' : 'var(--parchment)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span style={{ color: 'var(--text-secondary)' }}>
                          <FactorIcon factor={factor.factor_type as FactorType} size={36} weight="thin" />
                        </span>
                        {completed && (
                          <span className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ backgroundColor: 'rgba(201,150,58,0.15)', color: 'var(--gold)' }}>
                            Active
                          </span>
                        )}
                        {!completed && (
                          <span className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ backgroundColor: 'var(--parchment)', color: 'var(--text-muted)' }}>
                            ~{meta.time}
                          </span>
                        )}
                      </div>

                      <h3 className="font-normal text-lg mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                        {meta.label}
                      </h3>

                      {completed ? (
                        <FactorSummary factor={factor} userId={userId} />
                      ) : (
                        <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
                          {meta.description}
                        </p>
                      )}

                      <div className="mt-4 text-sm font-medium" style={{ color: 'var(--terracotta)' }}>
                        <span className="flex items-center gap-1">{completed ? 'View today' : 'Begin discovery'} <ArrowRight size={14} weight="regular" /></span>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
          </div>
        </section>

        {completedFactors.length === 0 && (
          <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
            <p className="font-light">Click any card above to begin your first discovery.</p>
          </div>
        )}
      </div>
    </main>
  )
}

function FactorSummary({ factor, userId }: { factor: IdentityFactor; userId: string }) {
  const results = factor.results as Record<string, unknown>

  if (factor.factor_type === 'western_astrology') {
    const r = results as { sun_sign?: string; moon_sign?: string; rising_sign?: string; essence?: string }
    return (
      <EssenceCardSummary factorType="western_astrology" results={r} userId={userId} hasData={!!r.sun_sign}
        pills={
          <div className="flex gap-2 flex-wrap">
            {r.sun_sign && <Pill label={<Sun size={12} weight="regular" />} value={r.sun_sign} />}
            {r.moon_sign && <Pill label={<Moon size={12} weight="regular" />} value={r.moon_sign} />}
            {r.rising_sign && <Pill label={<ArrowUp size={12} weight="regular" />} value={r.rising_sign} />}
          </div>
        } />
    )
  }

  if (factor.factor_type === 'eastern_astrology') {
    const r = results as { animal?: string; element?: string; essence?: string }
    const AnimalIcon = getZodiacAnimalIcon(r.animal)
    const ElementIcon = getZodiacElementIcon(r.element)
    return (
      <EssenceCardSummary factorType="eastern_astrology" results={r} userId={userId} hasData={!!r.animal}
        pills={
          <div className="flex items-center gap-2 flex-wrap">
            {r.animal && (
              AnimalIcon ? (
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--parchment)', color: 'var(--text-secondary)' }} title={r.animal}>
                  {createElement(AnimalIcon, { size: 22 })}
                </div>
              ) : (
                <Pill label="" value={r.animal} />
              )
            )}
            {r.element && (
              ElementIcon ? (
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--parchment)', color: 'var(--text-secondary)' }} title={r.element}>
                  {createElement(ElementIcon, { size: 20 })}
                </div>
              ) : (
                <Pill label="" value={r.element} />
              )
            )}
          </div>
        } />
    )
  }

  if (factor.factor_type === 'spirituality') {
    return <SpiritualityCardSummary results={results as { traditions?: string[]; themes?: string[] }} />
  }

  if (factor.factor_type === 'tarot') {
    const r = results as { cards?: { name: string; reversed?: boolean }[]; summary?: string; essence?: string }
    return (
      <EssenceCardSummary factorType="tarot" results={r} userId={userId} hasData={!!r.cards?.length}
        pills={
          <div className="flex gap-2">
            {(r.cards ?? []).map(c => {
              const img = getTarotCardImage(c.name)
              return img ? (
                <div key={c.name} className="relative rounded-md overflow-hidden shrink-0" style={{ width: 40, height: 71 }}>
                  <Image src={img} alt={c.name} fill sizes="40px" className="object-cover"
                    style={{ transform: c.reversed ? 'rotate(180deg)' : 'none' }} />
                </div>
              ) : (
                <Pill key={c.name} label="" value={c.name} />
              )
            })}
          </div>
        } />
    )
  }

  if (factor.factor_type === 'values') {
    return <ValuesCardSummary factor={factor} userId={userId} />
  }

  if (factor.factor_type === 'ikigai') {
    return <IkigaiCardSummary factor={factor} userId={userId} />
  }

  return null
}

function IkigaiCardSummary({ factor, userId }: { factor: IdentityFactor; userId: string }) {
  const results = factor.results as {
    ikigai_statement?: string; love?: string[]; good_at?: string[]; world_needs?: string[]; paid_for?: string[]; essence?: string
  }
  const [word, setWord] = useState<string | null>(results.essence ?? null)
  const supabase = createClient()

  useEffect(() => {
    if (word || !results.ikigai_statement) return
    let cancelled = false
    fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor: 'ikigai', backfillEssence: true, data: results }),
    })
      .then(res => res.json())
      .then(async data => {
        if (cancelled || !data.essence) return
        setWord(data.essence)
        await supabase.from('identity_factors')
          .update({ results: { ...results, essence: data.essence } })
          .eq('user_id', userId).eq('factor_type', 'ikigai')
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex justify-center py-1">
      <IkigaiVenn word={word} />
    </div>
  )
}

function IkigaiVenn({ word }: { word: string | null }) {
  const circles = [
    { cx: 54, cy: 54, color: 'var(--firstlight)' },
    { cx: 106, cy: 54, color: 'var(--sage)' },
    { cx: 54, cy: 106, color: 'var(--forest)' },
    { cx: 106, cy: 106, color: 'var(--gold)' },
  ]

  return (
    <div className="relative" style={{ width: 150, height: 150, isolation: 'isolate' }}>
      <svg viewBox="0 0 160 160" width="150" height="150">
        {circles.map((c, i) => (
          <circle key={i} cx={c.cx} cy={c.cy} r="50" fill={c.color} fillOpacity="0.55" style={{ mixBlendMode: 'multiply' }} />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {word ? (
          <span className="px-3 py-1 rounded-full text-xs font-semibold text-center"
            style={{
              backgroundColor: 'var(--warm-white)', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)',
              boxShadow: '0 1px 6px rgba(0,0,0,0.18)',
            }}>
            {word}
          </span>
        ) : (
          <div className="h-3 w-12 rounded-full animate-pulse" style={{ backgroundColor: 'var(--warm-white)' }} />
        )}
      </div>
    </div>
  )
}

function ValuesCardSummary({ factor, userId }: { factor: IdentityFactor; userId: string }) {
  const results = factor.results as { top_values?: string[]; reflections?: Record<string, string>; literary_quote?: { text: string; author: string; work?: string } }
  const [quote, setQuote] = useState(results.literary_quote ?? null)
  const supabase = createClient()

  useEffect(() => {
    if (quote || !results.top_values?.length) return
    let cancelled = false
    fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor: 'values', backfillQuote: true, data: results }),
    })
      .then(res => res.json())
      .then(async data => {
        if (cancelled || !data.literary_quote) return
        setQuote(data.literary_quote)
        await supabase.from('identity_factors')
          .update({ results: { ...results, literary_quote: data.literary_quote } })
          .eq('user_id', userId).eq('factor_type', 'values')
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 flex-wrap">
        {(results.top_values ?? []).map(v => <Pill key={v} label="" value={v} />)}
      </div>
      {results.top_values?.length ? (
        quote ? (
          <div className="pt-3 border-t" style={{ borderColor: 'var(--parchment)' }}>
            <p className="text-sm italic font-light leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-serif)' }}>
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              — {quote.author}{quote.work ? `, ${quote.work}` : ''}
            </p>
          </div>
        ) : (
          <div className="h-3 w-2/3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--parchment)' }} />
        )
      ) : null}
    </div>
  )
}

function EssenceCardSummary({ factorType, results, userId, pills, hasData = true }: {
  factorType: 'tarot' | 'western_astrology' | 'eastern_astrology'
  results: Record<string, unknown> & { essence?: string }
  userId: string
  pills: React.ReactNode
  hasData?: boolean
}) {
  const [essence, setEssence] = useState<string | null>(results.essence ?? null)
  const supabase = createClient()

  useEffect(() => {
    if (essence || !hasData) return
    let cancelled = false
    fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor: factorType, backfillEssence: true, data: results }),
    })
      .then(res => res.json())
      .then(async data => {
        if (cancelled || !data.essence) return
        setEssence(data.essence)
        await supabase.from('identity_factors')
          .update({ results: { ...results, essence: data.essence } })
          .eq('user_id', userId).eq('factor_type', factorType)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex flex-col gap-3">
      {pills}
      {hasData ? (
        essence ? (
          <p className="text-sm italic font-light" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-serif)' }}>
            &ldquo;{essence}&rdquo;
          </p>
        ) : (
          <div className="h-3 w-2/3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--parchment)' }} />
        )
      ) : null}
    </div>
  )
}

function SpiritualityCardSummary({ results }: { results: { traditions?: string[]; themes?: string[] } }) {
  const [mantra, setMantra] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/daily-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor: 'spirituality', factorResults: results, mantraOnly: true }),
    })
      .then(res => res.json())
      .then(data => { if (!cancelled) setMantra(data.mantra ?? null) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 flex-wrap">
        {(results.traditions ?? []).slice(0, 3).map(t => <Pill key={t} label="" value={t} />)}
      </div>
      <div className="pt-3 border-t" style={{ borderColor: 'var(--parchment)' }}>
        <p className="text-[10px] font-medium mb-1 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          Today&apos;s Mantra
        </p>
        {mantra ? (
          <p className="text-sm italic font-light" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-serif)' }}>
            &ldquo;{mantra}&rdquo;
          </p>
        ) : (
          <div className="h-3 w-2/3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--parchment)' }} />
        )}
      </div>
    </div>
  )
}

function Pill({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
      style={{ backgroundColor: 'var(--parchment)', color: 'var(--text-secondary)' }}>
      {label} {value}
    </span>
  )
}
