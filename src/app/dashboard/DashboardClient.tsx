'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FactorType, FACTOR_META, IdentityFactor, UserProfile } from '@/lib/types'

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
        <h1 className="text-2xl font-bold tracking-widest" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
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
          style={{ background: 'linear-gradient(135deg, var(--terracotta) 0%, var(--rust) 100%)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-4 right-6 text-white opacity-20 text-6xl font-serif">✦</div>
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
        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
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
                        <span className="text-4xl">{meta.emoji}</span>
                        {completed && (
                          <span className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ backgroundColor: 'rgba(201,169,110,0.15)', color: 'var(--gold)' }}>
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

                      <h3 className="font-semibold text-lg mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                        {meta.label}
                      </h3>

                      {completed ? (
                        <FactorSummary factor={factor} />
                      ) : (
                        <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
                          {meta.description}
                        </p>
                      )}

                      <div className="mt-4 text-sm font-medium" style={{ color: 'var(--terracotta)' }}>
                        {completed ? 'View today →' : 'Begin discovery →'}
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              )
            })}
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

function FactorSummary({ factor }: { factor: IdentityFactor }) {
  const results = factor.results as Record<string, unknown>

  if (factor.factor_type === 'western_astrology') {
    const r = results as { sun_sign?: string; moon_sign?: string; rising_sign?: string }
    return (
      <div className="flex gap-2 flex-wrap">
        {r.sun_sign && <Pill label="☀️" value={r.sun_sign} />}
        {r.moon_sign && <Pill label="🌙" value={r.moon_sign} />}
        {r.rising_sign && <Pill label="↑" value={r.rising_sign} />}
      </div>
    )
  }

  if (factor.factor_type === 'eastern_astrology') {
    const r = results as { animal?: string; element?: string }
    return (
      <div className="flex gap-2 flex-wrap">
        {r.animal && <Pill label="" value={r.animal} />}
        {r.element && <Pill label="" value={r.element} />}
      </div>
    )
  }

  if (factor.factor_type === 'spirituality') {
    const r = results as { traditions?: string[] }
    return (
      <div className="flex gap-2 flex-wrap">
        {(r.traditions ?? []).slice(0, 3).map(t => <Pill key={t} label="" value={t} />)}
      </div>
    )
  }

  if (factor.factor_type === 'tarot') {
    const r = results as { cards?: { name: string }[] }
    return (
      <div className="flex gap-2 flex-wrap">
        {(r.cards ?? []).map(c => <Pill key={c.name} label="" value={c.name} />)}
      </div>
    )
  }

  if (factor.factor_type === 'values') {
    const r = results as { top_values?: string[] }
    return (
      <div className="flex gap-2 flex-wrap">
        {(r.top_values ?? []).slice(0, 3).map(v => <Pill key={v} label="" value={v} />)}
      </div>
    )
  }

  if (factor.factor_type === 'ikigai') {
    const r = results as { ikigai_statement?: string }
    return (
      <p className="text-sm font-light italic" style={{ color: 'var(--text-secondary)' }}>
        {r.ikigai_statement ?? 'Your ikigai is taking shape.'}
      </p>
    )
  }

  return null
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs px-2 py-1 rounded-full"
      style={{ backgroundColor: 'var(--parchment)', color: 'var(--text-secondary)' }}>
      {label} {value}
    </span>
  )
}
