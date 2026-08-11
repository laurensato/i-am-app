'use client'
import { useState, useEffect, useRef, createElement } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Sun, Moon, ArrowUp, ArrowRight, CaretDown } from '@phosphor-icons/react'
import { FactorType, FACTOR_META, IdentityFactor, UserProfile } from '@/lib/types'
import { getZodiacAnimalIcon, getZodiacElementIcon } from '@/lib/zodiacIcons'
import FactorIcon from '@/components/FactorIcon'
import RotatingBackground from '@/components/RotatingBackground'
import IkigaiChart from '@/components/discover/IkigaiChart'
import TarotMiniCard from '@/components/discover/TarotMiniCard'
import Logo from '@/components/Logo'
import BreathworkOrb from '@/components/BreathworkOrb'

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
    fetchDailyMessage()
  }, [])

  async function fetchDailyMessage() {
    setLoadingMessage(true)
    try {
      const res = await fetch('/api/daily-message', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to load daily message')
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
    router.refresh()
  }

  const activeFactors = factors.filter(f => f.is_active)
  const completedFactors = activeFactors.filter(f => isFactorReady(f))
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <main className="min-h-screen pb-20" style={{ backgroundColor: 'var(--cream)' }}>
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between border-b"
        style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)' }}>
        <div className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Logo size={40} variant="lines" />
          <h1 className="text-xl font-normal" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', letterSpacing: '0.24em', textIndent: '0.24em' }}>
            I AM
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <AccountMenu firstName={profile.first_name} factors={factors} userId={userId} onSignOut={handleSignOut} />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-8 flex flex-col gap-8">

        {/* Daily message */}
        <motion.section
          className="p-8 relative overflow-hidden"
          style={{ backgroundColor: 'var(--sol-navy)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-4 right-6 opacity-60" style={{ color: 'var(--im-ochre)' }}><Logo size={56} variant="lines" /></div>
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
                <p className="text-xs text-white opacity-60 mb-1 uppercase" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}>Today&apos;s Mantra</p>
                <p className="text-white font-medium text-xl italic" style={{ fontFamily: 'var(--font-serif)' }}>
                  &ldquo;{dailyMessage?.mantra}&rdquo;
                </p>
              </div>
            </>
          )}
        </motion.section>

        <nav className="flex justify-center -mt-2">
          <Link
            href="/tools/breathwork"
            className="group flex flex-col items-center gap-2 rounded-full cursor-pointer transition-opacity hover:opacity-80"
            aria-label="Open breathwork tools"
          >
            <span className="pointer-events-none">
              <BreathworkOrb size={64} variant="default" animated />
            </span>
            <span
              className="pointer-events-none text-xs font-medium tracking-widest uppercase group-hover:opacity-80"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-serif)' }}
            >
              Breathwork
            </span>
          </Link>
        </nav>

        {/* Identity factor cards */}
        <section className="relative overflow-hidden p-4 sm:p-6">
          <RotatingBackground />

          <div className="relative">
          <h2 className="text-xl font-normal mb-4" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
            Your Identity Map
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {activeFactors.map((factor, i) => {
              const meta = FACTOR_META[factor.factor_type as FactorType]
              const completed = isFactorReady(factor)
              return (
                <motion.div
                  key={factor.factor_type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <Link href={`/discover/${factor.factor_type}`}>
                    <motion.div
                      className="p-6 cursor-pointer transition-all"
                      style={{
                        backgroundColor: 'var(--warm-white)',
                        border: '1px solid var(--parchment)',
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span style={{ color: 'var(--text-secondary)' }}>
                          <FactorIcon factor={factor.factor_type as FactorType} size={36} weight="thin" />
                        </span>
                        {completed && (
                          <span className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ backgroundColor: 'var(--selected-bg)', color: 'var(--text-primary)' }}>
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

                      <div className="mt-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
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

function isFactorReady(factor: IdentityFactor): boolean {
  if (factor.factor_type === 'tarot') return factor.is_active
  return factor.discovery_completed
}

function AccountMenu({ firstName, factors, userId, onSignOut }: {
  firstName: string
  factors: IdentityFactor[]
  userId: string
  onSignOut: () => void
}) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [togglingFactor, setTogglingFactor] = useState<FactorType | null>(null)
  const [toggleError, setToggleError] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to delete account')
      router.push('/')
      router.refresh()
    } catch {
      setDeleting(false)
      setDeleteError("Something went wrong — your account wasn't deleted. Please try again.")
    }
  }

  async function handleToggleFactor(factor: FactorType, row: IdentityFactor | undefined) {
    setTogglingFactor(factor)
    setToggleError('')
    const { error } = row
      ? await supabase.from('identity_factors')
        .update({ is_active: !row.is_active })
        .eq('user_id', userId).eq('factor_type', factor)
      : await supabase.from('identity_factors').insert({
        user_id: userId,
        factor_type: factor,
        discovery_completed: factor === 'tarot',
        discovery_data: {},
        results: {},
        is_active: true,
      })
    setTogglingFactor(null)
    if (error) {
      setToggleError('Could not update that factor — please try again.')
      return
    }
    router.refresh()
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 text-sm font-light" style={{ color: 'var(--text-muted)' }}>
          {firstName}
          <CaretDown size={12} weight="bold" />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-64 overflow-hidden z-50"
              style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
              <div className="border-b" style={{ borderColor: 'var(--parchment)' }}>
                <p className="px-4 pt-3 pb-1 text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Factors
                </p>
                {(Object.keys(FACTOR_META) as FactorType[]).map(f => {
                  const row = factors.find(r => r.factor_type === f)
                  const isOn = row ? row.is_active : false
                  return (
                    <button key={f} role="switch" aria-checked={isOn}
                      onClick={() => handleToggleFactor(f, row)} disabled={togglingFactor !== null}
                      className="w-full flex items-center justify-between gap-3 text-left px-4 py-2.5 text-sm font-light transition-colors hover:bg-black/5 disabled:opacity-50"
                      style={{ color: 'var(--text-primary)' }}>
                      <span className="flex items-center gap-3">
                        <span style={{ color: 'var(--text-secondary)' }}><FactorIcon factor={f} size={18} weight="thin" /></span>
                        {FACTOR_META[f].label}
                      </span>
                      <span
                        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                        style={{ backgroundColor: isOn ? 'var(--text-primary)' : 'var(--parchment)' }}>
                        <span
                          className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                          style={{ transform: isOn ? 'translateX(18px)' : 'translateX(3px)' }}
                        />
                      </span>
                    </button>
                  )
                })}
                {toggleError && <p className="px-4 pb-2 text-xs text-red-600">{toggleError}</p>}
              </div>
              <button onClick={() => { setOpen(false); onSignOut() }}
                className="w-full text-left px-4 py-3 text-sm font-light transition-colors hover:bg-black/5"
                style={{ color: 'var(--text-primary)' }}>
                Sign out
              </button>
              <button onClick={() => { setOpen(false); setDeleteError(''); setConfirmDelete(true) }}
                className="w-full text-left px-4 py-3 text-sm font-light border-t transition-colors hover:bg-black/5 text-red-600"
                style={{ borderColor: 'var(--parchment)' }}>
                Delete account
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div className="fixed inset-0 flex items-center justify-center px-6 z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !deleting && setConfirmDelete(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm p-6"
              style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}
              onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-normal mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                Delete your account?
              </h3>
              <p className="text-sm font-light mb-6" style={{ color: 'var(--text-muted)' }}>
                This permanently deletes your account and everything in it — your profile, discoveries, and daily history. This can&apos;t be undone.
              </p>
              {deleteError && <p className="text-sm text-red-600 mb-4">{deleteError}</p>}
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(false)} disabled={deleting}
                  className="flex-1 py-3 text-sm font-medium disabled:opacity-60"
                  style={{ backgroundColor: 'var(--parchment)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
                <button onClick={handleDeleteAccount} disabled={deleting}
                  className="flex-1 py-3 text-sm font-medium text-white bg-red-600 disabled:opacity-60">
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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
    return <TarotDashboardSummary />
  }

  if (factor.factor_type === 'values') {
    return <ValuesCardSummary factor={factor} userId={userId} />
  }

  if (factor.factor_type === 'ikigai') {
    return <IkigaiCardSummary factor={factor} userId={userId} />
  }

  return null
}

function TarotDashboardSummary() {
  const [state, setState] = useState<{
    daily: { cards: { name: string; reversed?: boolean }[] } | null
    weekly: { cards: { name: string; reversed?: boolean }[]; expiresAt?: string } | null
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/daily-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        factor: 'tarot',
        tarotDashboard: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    })
      .then(res => { if (!res.ok) throw new Error('Failed to load tarot cards'); return res.json() })
      .then(data => { if (!cancelled) setState(data) })
      .catch(() => { if (!cancelled) setState({ daily: null, weekly: null }) })
    return () => { cancelled = true }
  }, [])

  if (!state) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-3 w-16 rounded-full animate-pulse" style={{ backgroundColor: 'var(--parchment)' }} />
        <div className="flex gap-2">
          <div className="rounded-md animate-pulse" style={{ width: 40, height: 71, backgroundColor: 'var(--parchment)' }} />
        </div>
      </div>
    )
  }

  const dailyDrawn = !!state.daily?.cards.length

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[10px] font-medium mb-2 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          Daily
        </p>
        <div className="flex gap-2">
          <TarotMiniCard
            name={dailyDrawn ? state.daily!.cards[0]?.name : undefined}
            reversed={state.daily?.cards[0]?.reversed}
          />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-medium mb-2 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          Weekly
        </p>
        <div className="flex gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <TarotMiniCard
              key={`weekly-${i}`}
              name={state.weekly?.cards[i]?.name}
              reversed={state.weekly?.cards[i]?.reversed}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function IkigaiCardSummary({ factor, userId }: { factor: IdentityFactor; userId: string }) {
  const results = factor.results as { essence?: string; ikigai_statement?: string }
  const [essence, setEssence] = useState<string | null>(results.essence ?? null)
  const supabase = createClient()

  useEffect(() => {
    if (essence || !results.ikigai_statement) return
    let cancelled = false
    fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor: 'ikigai', backfillEssence: true, data: results }),
    })
      .then(res => res.json())
      .then(async data => {
        if (cancelled || !data.essence) return
        setEssence(data.essence)
        await supabase.from('identity_factors')
          .update({ results: { ...results, essence: data.essence } })
          .eq('user_id', userId).eq('factor_type', 'ikigai')
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex flex-col items-center gap-3 py-1">
      {results.ikigai_statement && (
        essence ? (
          <p
            className="text-xl font-normal tracking-wide"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
          >
            {essence}
          </p>
        ) : (
          <div className="h-5 w-24 rounded-full animate-pulse" style={{ backgroundColor: 'var(--parchment)' }} />
        )
      )}
      <IkigaiChart size={150} />
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
      .then(res => {
        if (!res.ok) throw new Error('Failed to load mantra')
        return res.json()
      })
      .then(data => { if (!cancelled) setMantra(data.mantra ?? null) })
      .catch(() => { if (!cancelled) setMantra('I am at peace with the mystery.') })
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
