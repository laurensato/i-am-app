'use client'

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkle } from '@phosphor-icons/react'
import BreathworkOrb from '@/components/BreathworkOrb'
import BreathworkLoader, { minBreathDelay } from '@/components/discover/BreathworkLoader'
import TarotCardReveal from '@/components/tarot/TarotCardReveal'
import VisualizationWaveIcon from '@/components/VisualizationWaveIcon'
import RitualStepIcon from '@/components/tools/rituals/RitualStepIcon'
import { useBreathPhaseSequence } from '@/hooks/useBreathPhaseSequence'
import {
  BREATH_PHASE_MS,
  CALMING_CYCLES,
  CALMING_PHASES,
  DESTRESS_INSTRUCTIONS,
  ENERGY_BOOST_PHASES,
  ENERGY_BOOST_ROUNDS,
  GROUNDING_ROUNDS,
  PEACE_INSTRUCTIONS,
  SQUARE_BREATH_PHASES,
  WELLNESS_INSTRUCTIONS,
  type BreathOrbPattern,
} from '@/lib/breathwork'
import { journalSaveErrorMessage } from '@/lib/journalErrors'
import { getEntryMonth } from '@/lib/journal'
import { pickJournalPrompt } from '@/lib/journalPrompts'
import { userTimezone, todayDateKey } from '@/lib/journalReading'
import { parseWesternAstrologyReading } from '@/lib/structuredReading'
import type { RitualStepDefinition, RitualStepId } from '@/lib/ritual'
import {
  CONFIDENCE_STEPS,
  MINDFUL_CLOUDS_STEPS,
  PEACE_VISUALIZATION_STEPS,
  WORRY_JAR_STEPS,
  type VisualizationStep,
} from '@/lib/visualizations'
import { createClient } from '@/lib/supabase/client'
import type { FactorType, IdentityFactor } from '@/lib/types'

export type RitualStepContentHandle = {
  tryAdvanceSubStep: () => boolean
}

type Profile = { first_name: string; age: number; gender: string } | null

type Props = {
  step: RitualStepDefinition
  factors: IdentityFactor[]
  userId: string
  profile: Profile
}

type StructuredReading = {
  headline?: string
  items: { label: string; reflection: string }[]
  summary: string
}

import { parseTarotDailyReading, parseTarotMultiReading } from '@/lib/tarotReading'

function TarotDailyReadingBody({
  loading,
  content,
  label = "Today's Card",
}: {
  loading: boolean
  content: string
  label?: string
}) {
  if (loading) {
    return (
      <div className="py-6">
        <BreathworkLoader
          message="Before we begin, our breath connects us back to ourselves."
          variant="default"
        />
      </div>
    )
  }

  const reading = parseTarotDailyReading(content)

  return (
    <div className="flex flex-col gap-4 text-left">
      <p
        className="text-[10px] font-medium tracking-widest uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </p>
      {reading ? (
        <>
          <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {reading.cardMeaning}
          </p>
          <p
            className="text-sm font-light leading-relaxed pt-3 border-t"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--parchment)' }}
          >
            {reading.summary}
          </p>
        </>
      ) : (
        <p className="text-sm font-light leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
          {content}
        </p>
      )}
    </div>
  )
}

function parseStructuredReading(content: string, itemsKey: 'cards' | 'aspects'): StructuredReading | null {
  if (itemsKey === 'aspects') {
    const reading = parseWesternAstrologyReading(content)
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
    // plain text
  }
  return null
}

function parseTarotMultiForDisplay(content: string): StructuredReading | null {
  const reading = parseTarotMultiReading(content)
  if (!reading) return null
  return {
    headline: reading.headline,
    items: reading.items,
    summary: reading.summary,
  }
}

function ReadingBody({
  loading,
  content,
  parse,
  label = "Today's Insight",
}: {
  loading: boolean
  content: string
  parse?: (content: string) => StructuredReading | null
  label?: string
}) {
  if (loading) {
    return (
      <div className="py-6">
        <BreathworkLoader
          message="Before we begin, our breath connects us back to ourselves."
          variant="default"
        />
      </div>
    )
  }

  const reading = parse?.(content) ?? null

  return (
    <div className="flex flex-col gap-4 text-left">
      <p
        className="text-[10px] font-medium tracking-widest uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </p>
      {reading ? (
        <>
          {reading.headline && (
            <p
              className="text-base font-normal leading-snug"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
            >
              {reading.headline}
            </p>
          )}
          <ul className="flex flex-col gap-3">
            {reading.items.map(item => (
              <li key={item.label}>
                <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                  {item.label}
                </p>
                <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {item.reflection}
                </p>
              </li>
            ))}
          </ul>
          <p className="text-sm font-light leading-relaxed pt-1" style={{ color: 'var(--text-secondary)' }}>
            {reading.summary}
          </p>
        </>
      ) : (
        <p className="text-sm font-light leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
          {content}
        </p>
      )}
    </div>
  )
}

function OverviewStepContent() {
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState('')
  const [mantra, setMantra] = useState('')

  useEffect(() => {
    let cancelled = false
    const breath = minBreathDelay()

    fetch('/api/daily-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone: userTimezone() }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load overview')
        return res.json()
      })
      .then(async data => {
        await breath
        if (!cancelled) {
          setInsight(data.insight ?? 'Take a breath. You are enough.')
          setMantra(data.mantra ?? 'I am becoming.')
        }
      })
      .catch(async () => {
        await breath
        if (!cancelled) {
          setInsight('Take a breath. You are enough.')
          setMantra('I am becoming.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="py-6">
        <BreathworkLoader variant="default" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 text-left">
      <div>
        <p
          className="text-[10px] font-medium tracking-widest uppercase mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Today&apos;s Insight
        </p>
        <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {insight}
        </p>
      </div>
      <div
        className="px-4 py-4 border-t border-b"
        style={{
          borderColor: 'var(--parchment)',
          backgroundColor: 'color-mix(in srgb, var(--selected-bg) 22%, var(--warm-white))',
        }}
      >
        <p
          className="text-[10px] font-medium tracking-widest uppercase mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Today&apos;s Mantra
        </p>
        <p
          className="text-base italic font-light leading-relaxed"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
        >
          &ldquo;{mantra}&rdquo;
        </p>
      </div>
    </div>
  )
}

function FactorReadingStepContent({
  factor,
  factorRow,
  profile,
}: {
  factor: FactorType
  factorRow: IdentityFactor
  profile: Profile
}) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const breath = minBreathDelay()

    fetch('/api/daily-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        factor,
        factorResults: factorRow.results,
        profile,
        timezone: userTimezone(),
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load reading')
        return res.json()
      })
      .then(async data => {
        await breath
        if (!cancelled) setContent(data.factor_content ?? data.insight ?? '')
      })
      .catch(async () => {
        await breath
        if (!cancelled) setContent('Sit with what arises. There is wisdom in pausing here.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [factor, factorRow.results, profile])

  const parse =
    factor === 'western_astrology'
      ? (text: string) => parseStructuredReading(text, 'aspects')
      : factor === 'ikigai'
        ? (text: string) => parseStructuredReading(text, 'cards')
        : undefined

  return <ReadingBody loading={loading} content={content} parse={parse} />
}

type TarotCard = { name: string; position: string; reversed?: boolean }

function loadTarotRevealed(storageKey: string, count: number): Set<number> {
  try {
    if (localStorage.getItem(storageKey) === 'all') {
      return new Set(Array.from({ length: count }, (_, i) => i))
    }
  } catch {
    // private browsing
  }
  return new Set()
}

function saveTarotRevealed(storageKey: string, revealed: Set<number>, total: number) {
  if (revealed.size < total) return
  try {
    localStorage.setItem(storageKey, 'all')
  } catch {
    // private browsing
  }
}

function TarotCardBackButton({
  onClick,
  disabled,
  label,
  compact,
}: {
  onClick: () => void
  disabled?: boolean
  label: string
  compact?: boolean
}) {
  const width = compact ? 72 : 96
  const height = compact ? 126 : 168

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-xl overflow-hidden transition-transform hover:scale-[1.02] disabled:opacity-60"
      style={{
        width,
        height,
        backgroundColor: 'var(--sol-navy)',
        border: '1px solid rgba(255,255,255,0.15)',
      }}
      aria-label={label}
    >
      <div className="w-full h-full flex items-center justify-center">
        <Sparkle size={compact ? 20 : 28} weight="thin" color="rgba(255,255,255,0.4)" />
      </div>
    </button>
  )
}

function TarotReadingStepContent({
  spread,
  factorRow,
  profile,
}: {
  spread: 'single' | 'weekly'
  factorRow: IdentityFactor
  profile: Profile
}) {
  const [cards, setCards] = useState<TarotCard[] | null>(null)
  const [drawnAt, setDrawnAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [drawing, setDrawing] = useState(false)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [content, setContent] = useState('')
  const [readingLoading, setReadingLoading] = useState(false)

  const dailyRevealKey = `tarot_daily_${todayDateKey()}`
  const weeklyRevealKey = drawnAt ? `tarot_weekly_${drawnAt}` : null
  const revealKey = spread === 'weekly' ? weeklyRevealKey : dailyRevealKey

  const readyForReading = cards !== null && cards.length > 0 && revealed.size === cards.length

  useEffect(() => {
    let cancelled = false
    fetch('/api/daily-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor: 'tarot', tarotDashboard: true, timezone: userTimezone() }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load tarot')
        return res.json()
      })
      .then(data => {
        if (cancelled) return
        const source = spread === 'weekly' ? data.weekly : data.daily
        if (source?.cards?.length) {
          setCards(source.cards)
          if (spread === 'weekly' && source.drawnAt) {
            setDrawnAt(source.drawnAt)
            setRevealed(loadTarotRevealed(`tarot_weekly_${source.drawnAt}`, source.cards.length))
          } else {
            setRevealed(loadTarotRevealed(dailyRevealKey, source.cards.length))
          }
          if (spread === 'weekly' && source.content) {
            setContent(source.content)
          }
        }
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [spread, dailyRevealKey])

  useEffect(() => {
    if (!readyForReading || (spread === 'weekly' && content)) return
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
        tarotSpread: spread === 'weekly' ? 'weekly' : 'single',
        timezone: userTimezone(),
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load tarot reading')
        return res.json()
      })
      .then(async data => {
        await breath
        if (!cancelled) setContent(data.factor_content ?? '')
      })
      .catch(async () => {
        await breath
        if (!cancelled) {
          setContent(
            spread === 'weekly'
              ? 'Your weekly spread holds a message for the days ahead. Sit with what arises.'
              : 'Your card holds a message for today. Sit with what arises.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setReadingLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [readyForReading, factorRow.results, profile, spread, content])

  async function drawCards() {
    setDrawing(true)
    try {
      const res = await fetch('/api/daily-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factor: 'tarot',
          ...(spread === 'weekly'
            ? { weeklyCardsOnly: true }
            : { cardsOnly: true, tarotSpread: 'single' }),
          timezone: userTimezone(),
        }),
      })
      if (!res.ok) throw new Error('Failed to draw cards')
      const data = await res.json()
      setCards(data.cards ?? [])
      setRevealed(new Set())
      setContent('')
      if (spread === 'weekly') {
        setDrawnAt(data.drawnAt ?? null)
        if (data.drawnAt) {
          try {
            localStorage.removeItem(`tarot_weekly_${data.drawnAt}`)
          } catch {
            // private browsing
          }
        }
      } else {
        try {
          localStorage.removeItem(dailyRevealKey)
        } catch {
          // private browsing
        }
      }
    } catch {
      setCards(null)
      if (spread === 'weekly') setDrawnAt(null)
    }
    setDrawing(false)
  }

  function revealCard(index: number) {
    if (!cards || !revealKey) return
    setRevealed(prev => {
      const next = new Set(prev).add(index)
      saveTarotRevealed(revealKey, next, cards.length)
      return next
    })
  }

  if (loading) {
    return (
      <div className="py-6">
        <BreathworkLoader variant="default" message="Checking for today's cards…" />
      </div>
    )
  }

  if (!cards?.length) {
    const cardCount = spread === 'weekly' ? 3 : 1
    const drawLabel =
      spread === 'weekly' ? "Draw this week's cards" : "Draw today's card"

    return (
      <div className="flex flex-col gap-4 items-center py-4">
        <p className="text-sm font-light text-center max-w-xs" style={{ color: 'var(--text-muted)' }}>
          {spread === 'weekly'
            ? 'Three cards for the week ahead — Theme, Focus, and Invitation.'
            : 'One card for today — a focused message to sit with.'}
        </p>
        <div className={`flex justify-center${spread === 'weekly' ? ' gap-3' : ''}`}>
          {Array.from({ length: cardCount }, (_, i) => (
            <TarotCardBackButton
              key={i}
              onClick={drawCards}
              disabled={drawing}
              label={drawLabel}
              compact={spread === 'weekly'}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={drawCards}
          disabled={drawing}
          className="text-sm font-medium disabled:opacity-60 transition-opacity hover:opacity-80"
          style={{ color: 'var(--text-primary)' }}
        >
          {drawing ? 'Drawing…' : drawLabel}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 items-center">
      <TarotCardReveal
        cards={cards}
        revealed={revealed}
        onReveal={revealCard}
        compact={spread === 'weekly'}
        showLabels={false}
      />

      {revealed.size < cards.length && (
        <p className="text-xs font-light text-center" style={{ color: 'var(--text-muted)' }}>
          {spread === 'weekly'
            ? "Tap each card to reveal it and unlock this week's reading."
            : "Tap the card to reveal it and unlock today's reading."}
        </p>
      )}

      {readyForReading && (
        <div className="w-full">
          {spread === 'single' ? (
            <TarotDailyReadingBody
              loading={readingLoading}
              content={content}
              label="Today's Card"
            />
          ) : (
            <ReadingBody
              loading={readingLoading}
              content={content}
              parse={parseTarotMultiForDisplay}
              label="Weekly Reading"
            />
          )}
        </div>
      )}
    </div>
  )
}

function JournalStepContent({ userId }: { userId: string }) {
  const [draft, setDraft] = useState('')
  const [prompt] = useState(() => pickJournalPrompt())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  async function saveEntry() {
    const content = draft.trim()
    if (!content || saving) return

    setSaving(true)
    setSaveError('')

    const entryMonth = getEntryMonth()
    const supabase = createClient()

    const { error } = await supabase.from('journal_entries').insert({
      user_id: userId,
      content,
      entry_month: entryMonth,
    })

    setSaving(false)

    if (error) {
      setSaveError(journalSaveErrorMessage(error))
      return
    }

    setSaved(true)
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      <p
        className="text-sm font-light italic leading-relaxed"
        style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)' }}
      >
        {prompt}
      </p>
      <textarea
        value={draft}
        onChange={event => setDraft(event.target.value)}
        rows={6}
        placeholder="Write freely…"
        className="w-full resize-none border px-3 py-2.5 text-sm font-light leading-relaxed outline-none focus:ring-1"
        style={{
          borderColor: 'var(--parchment)',
          backgroundColor: 'var(--warm-white)',
          color: 'var(--text-primary)',
        }}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={saveEntry}
          disabled={!draft.trim() || saving || saved}
          className="px-4 py-2 text-xs font-medium disabled:opacity-50"
          style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-text)' }}
        >
          {saved ? 'Saved' : saving ? 'Saving…' : 'Save entry'}
        </button>
        {saveError && (
          <p className="text-xs font-light" style={{ color: 'var(--text-muted)' }}>
            {saveError}
          </p>
        )}
      </div>
    </div>
  )
}

const BreathworkStepContent = forwardRef<
  RitualStepContentHandle,
  { stepId: RitualStepId; onSubStepChange: (hasMore: boolean) => void }
>(function BreathworkStepContent({ stepId, onSubStepChange }, ref) {
  const [sessionKey] = useState(() => Date.now())
  const [instructionIndex, setInstructionIndex] = useState(0)
  const [phaseStep, setPhaseStep] = useState(0)

  const config = useMemo(() => {
    switch (stepId) {
      case 'breathwork_grounding':
        return {
          pattern: 'square' as BreathOrbPattern,
          rounds: GROUNDING_ROUNDS,
          phases: SQUARE_BREATH_PHASES.map(p => p),
          phaseMs: BREATH_PHASE_MS,
          instructions: null as readonly string[] | null,
        }
      case 'breathwork_calming':
        return {
          pattern: 'fourSevenEight' as BreathOrbPattern,
          rounds: CALMING_CYCLES,
          phases: CALMING_PHASES.map(p => p.label),
          phaseMs: 0,
          instructions: null,
        }
      case 'breathwork_energy_boost':
        return {
          pattern: 'sixTwo' as BreathOrbPattern,
          rounds: ENERGY_BOOST_ROUNDS,
          phases: ENERGY_BOOST_PHASES.map(p => p.label),
          phaseMs: 0,
          instructions: null,
        }
      case 'breathwork_wellness':
        return {
          pattern: 'wellness' as BreathOrbPattern,
          rounds: undefined,
          phases: [],
          phaseMs: 0,
          instructions: WELLNESS_INSTRUCTIONS,
        }
      case 'breathwork_destress':
        return {
          pattern: 'wellness' as BreathOrbPattern,
          rounds: undefined,
          phases: [],
          phaseMs: 0,
          instructions: DESTRESS_INSTRUCTIONS,
        }
      case 'breathwork_peace':
        return {
          pattern: 'wellness' as BreathOrbPattern,
          rounds: undefined,
          phases: [],
          phaseMs: 0,
          instructions: PEACE_INSTRUCTIONS,
        }
      default:
        return {
          pattern: 'square' as BreathOrbPattern,
          rounds: GROUNDING_ROUNDS,
          phases: SQUARE_BREATH_PHASES.map(p => p),
          phaseMs: BREATH_PHASE_MS,
          instructions: null,
        }
    }
  }, [stepId])

  const calmingActive = stepId === 'breathwork_calming'
  const energyActive = stepId === 'breathwork_energy_boost'
  const { phaseLabel: calmingPhase, cycle: calmingCycle } = useBreathPhaseSequence(
    calmingActive,
    sessionKey,
    CALMING_PHASES,
    CALMING_CYCLES,
  )
  const { phaseLabel: energyPhase, cycle: energyCycle } = useBreathPhaseSequence(
    energyActive,
    sessionKey,
    ENERGY_BOOST_PHASES,
    ENERGY_BOOST_ROUNDS,
  )

  useEffect(() => {
    if (calmingActive || config.instructions || config.phaseMs === 0) return

    const id = setInterval(() => {
      setPhaseStep(step => step + 1)
    }, config.phaseMs)

    return () => clearInterval(id)
  }, [calmingActive, config.instructions, config.phaseMs, sessionKey])

  useEffect(() => {
    if (config.instructions) {
      onSubStepChange(instructionIndex < config.instructions.length - 1)
    } else {
      onSubStepChange(false)
    }
  }, [config.instructions, instructionIndex, onSubStepChange])

  useImperativeHandle(ref, () => ({
    tryAdvanceSubStep: () => {
      if (!config.instructions || instructionIndex >= config.instructions.length - 1) return false
      setInstructionIndex(i => i + 1)
      return true
    },
  }))

  const phaseDisplay = calmingActive
    ? calmingPhase
    : energyActive
      ? energyPhase
      : config.phases.length
        ? config.phases[phaseStep % config.phases.length]
        : null

  const cycleDisplay = calmingActive
    ? calmingCycle
    : energyActive
      ? energyCycle
      : null

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <BreathworkOrb
        key={sessionKey}
        size={120}
        variant="default"
        pattern={config.pattern}
        animated
        rounds={config.rounds}
      />

      {config.instructions ? (
        <AnimatePresence mode="wait">
          <motion.p
            key={instructionIndex}
            initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
            transition={{ duration: 0.5 }}
            className="text-sm font-light leading-relaxed text-center max-w-sm px-2"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)' }}
          >
            {config.instructions[instructionIndex]}
          </motion.p>
        </AnimatePresence>
      ) : phaseDisplay ? (
        <div className="flex flex-col items-center gap-1" aria-live="polite">
          <p
            className="text-[10px] tracking-[0.2em] uppercase font-light"
            style={{ color: 'var(--text-muted)' }}
          >
            {phaseDisplay}
          </p>
          {config.rounds && (
            <p className="text-[10px] font-light" style={{ color: 'var(--text-muted)' }}>
              {cycleDisplay != null
                ? `Cycle ${cycleDisplay} of ${config.rounds}`
                : 'Follow the orb'}
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
})

const VisualizationStepContent = forwardRef<
  RitualStepContentHandle,
  { steps: VisualizationStep[]; onSubStepChange: (hasMore: boolean) => void }
>(function VisualizationStepContent({ steps, onSubStepChange }, ref) {
  const [stepIndex, setStepIndex] = useState(0)
  const step = steps[stepIndex]

  useEffect(() => {
    onSubStepChange(stepIndex < steps.length - 1)
  }, [stepIndex, steps.length, onSubStepChange])

  useImperativeHandle(ref, () => ({
    tryAdvanceSubStep: () => {
      if (stepIndex >= steps.length - 1) return false
      setStepIndex(i => i + 1)
      return true
    },
  }))

  return (
    <div className="flex flex-col items-center gap-4 py-2 min-h-[200px]">
      <VisualizationWaveIcon size={96} variant="default" animated />

      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-center px-2 max-w-sm"
        >
          <p
            className="text-[10px] tracking-[0.15em] uppercase font-light mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            {step.title}
          </p>
          <p
            className="text-sm font-light leading-relaxed"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)' }}
          >
            {step.text}
          </p>
        </motion.div>
      </AnimatePresence>

      <p className="text-[10px] font-light" style={{ color: 'var(--text-muted)' }}>
        Step {stepIndex + 1} of {steps.length}
      </p>
    </div>
  )
})

function visualizationStepsForId(id: RitualStepId): VisualizationStep[] | null {
  switch (id) {
    case 'visualization_worry_jar':
      return WORRY_JAR_STEPS
    case 'visualization_mindful_clouds':
      return MINDFUL_CLOUDS_STEPS
    case 'visualization_confidence':
      return CONFIDENCE_STEPS
    case 'visualization_peace':
      return PEACE_VISUALIZATION_STEPS
    default:
      return null
  }
}

function getFactorRow(factors: IdentityFactor[], factor: FactorType): IdentityFactor | undefined {
  return factors.find(row => row.factor_type === factor)
}

const RitualStepContent = forwardRef<RitualStepContentHandle, Props>(function RitualStepContent(
  { step, factors, userId, profile },
  ref,
) {
  const [hasSubSteps, setHasSubSteps] = useState(false)
  const subStepRef = useRef<RitualStepContentHandle>(null)

  useImperativeHandle(ref, () => ({
    tryAdvanceSubStep: () => subStepRef.current?.tryAdvanceSubStep() ?? false,
  }))

  const vizSteps = visualizationStepsForId(step.id)

  let body: React.ReactNode

  if (step.id === 'daily_message') {
    body = <OverviewStepContent />
  } else if (step.id === 'tarot_daily' || step.id === 'tarot_weekly') {
    const factorRow = getFactorRow(factors, 'tarot')
    body = factorRow ? (
      <TarotReadingStepContent
        spread={step.id === 'tarot_weekly' ? 'weekly' : 'single'}
        factorRow={factorRow}
        profile={profile}
      />
    ) : (
      <p className="text-sm font-light text-center py-6" style={{ color: 'var(--text-muted)' }}>
        Complete Tarot discovery to unlock this step.
      </p>
    )
  } else if (step.kind === 'reading' && step.factor && step.factor !== 'tarot') {
    const factorRow = getFactorRow(factors, step.factor)
    body = factorRow ? (
      <FactorReadingStepContent factor={step.factor} factorRow={factorRow} profile={profile} />
    ) : (
      <p className="text-sm font-light text-center py-6" style={{ color: 'var(--text-muted)' }}>
        Complete discovery for this reading first.
      </p>
    )
  } else if (step.id === 'journal') {
    body = <JournalStepContent userId={userId} />
  } else if (step.icon === 'breathwork') {
    body = <BreathworkStepContent ref={subStepRef} stepId={step.id} onSubStepChange={setHasSubSteps} />
  } else if (vizSteps) {
    body = <VisualizationStepContent ref={subStepRef} steps={vizSteps} onSubStepChange={setHasSubSteps} />
  } else {
    body = (
      <p className="text-sm font-light text-center py-6" style={{ color: 'var(--text-muted)' }}>
        {step.description}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="shrink-0 flex items-center justify-center" style={{ width: 44, height: 44 }}>
          <RitualStepIcon step={step} size={40} />
        </div>
        <div className="min-w-0 text-left">
          <h3
            className="text-base font-normal leading-snug"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
          >
            {step.label}
          </h3>
          {hasSubSteps && (
            <p className="text-[10px] font-light mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Tap next to continue this step
            </p>
          )}
        </div>
      </div>
      {body}
    </div>
  )
})

export default RitualStepContent
