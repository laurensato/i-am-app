'use client'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export const BREATH_PHASE_MS = 4000
/** Minimum breath before revealing Today's Insight: inhale + hold + exhale */
export const MIN_BREATH_MS = BREATH_PHASE_MS * 3

const BREATH_PHASES = ['inhale', 'hold', 'exhale', 'hold'] as const

type Props = {
  message?: string
  /** Use inside the dark navy insight card */
  variant?: 'default' | 'onDark'
}

export default function BreathworkLoader({
  message = 'Before we begin, our breath connects us back to ourselves.',
  variant = 'onDark',
}: Props) {
  const onDark = variant === 'onDark'
  const messageColor = onDark ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)'
  const phaseColor = onDark ? 'rgba(255,255,255,0.55)' : 'var(--text-muted)'

  const [phaseIndex, setPhaseIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setPhaseIndex(i => (i + 1) % BREATH_PHASES.length)
    }, BREATH_PHASE_MS)
    return () => clearInterval(id)
  }, [])

  const phase = BREATH_PHASES[phaseIndex]

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <p
        className="text-center text-sm font-light leading-relaxed mb-10 max-w-xs"
        style={{ fontFamily: 'var(--font-serif)', color: messageColor }}
      >
        {message}
      </p>

      <div className="relative flex items-center justify-center mb-6" style={{ width: 168, height: 168 }}>
        <div
          className="breath-orb-halo absolute rounded-full"
          aria-hidden
          style={{
            width: 168,
            height: 168,
            background: onDark
              ? 'radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(190,210,235,0.08) 30%, transparent 62%)'
              : 'radial-gradient(circle, rgba(190,210,235,0.4) 0%, rgba(147,180,210,0.16) 35%, transparent 65%)',
            filter: 'blur(22px)',
          }}
        />

        <div
          className="breath-orb-mid absolute rounded-full"
          aria-hidden
          style={{
            width: 120,
            height: 120,
            background: onDark
              ? 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(210,225,245,0.1) 40%, transparent 68%)'
              : 'radial-gradient(circle, rgba(220,235,250,0.36) 0%, rgba(180,205,230,0.14) 45%, transparent 72%)',
            filter: 'blur(14px)',
          }}
        />

        <div
          className="breath-orb-core absolute rounded-full"
          aria-hidden
          style={{
            width: 88,
            height: 88,
            background: onDark
              ? 'radial-gradient(circle at 50% 48%, rgba(255,255,255,0.9) 0%, rgba(225,238,252,0.56) 28%, rgba(190,215,235,0.2) 52%, transparent 72%)'
              : 'radial-gradient(circle at 50% 48%, rgba(255,255,255,0.95) 0%, rgba(210,228,248,0.64) 28%, rgba(170,200,225,0.24) 52%, transparent 72%)',
            filter: 'blur(10px)',
            boxShadow: onDark
              ? '0 0 56px rgba(220,235,255,0.44), 0 0 96px rgba(180,205,230,0.24)'
              : '0 0 48px rgba(190,210,235,0.56), 0 0 80px rgba(160,190,220,0.28)',
          }}
        />
      </div>

      <div className="h-6 flex items-center justify-center" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35 }}
            className="text-xs tracking-[0.25em] uppercase font-light"
            style={{ color: phaseColor }}
          >
            {phase}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}

export function InsightBreathworkCard() {
  return (
    <div className="p-6" style={{ backgroundColor: 'var(--sol-navy)' }}>
      <BreathworkLoader variant="onDark" />
    </div>
  )
}

export function minBreathDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, MIN_BREATH_MS))
}
