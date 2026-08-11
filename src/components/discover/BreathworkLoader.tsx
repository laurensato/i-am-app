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
            width: 140,
            height: 140,
            background: onDark
              ? 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(180,200,230,0.08) 45%, transparent 72%)'
              : 'radial-gradient(circle, rgba(180,200,230,0.35) 0%, rgba(147,180,210,0.15) 50%, transparent 75%)',
            filter: 'blur(10px)',
          }}
        />

        <div
          className="breath-orb-mid absolute rounded-full"
          aria-hidden
          style={{
            width: 100,
            height: 100,
            background: onDark
              ? 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(200,220,240,0.04) 60%, transparent 100%)'
              : 'radial-gradient(circle, rgba(200,220,240,0.25) 0%, rgba(147,180,210,0.1) 60%, transparent 100%)',
            filter: 'blur(6px)',
          }}
        />

        <div
          className="breath-orb-core absolute rounded-full"
          aria-hidden
          style={{
            width: 72,
            height: 72,
            background: onDark
              ? 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.95), rgba(210,225,240,0.55) 55%, rgba(140,170,200,0.3) 100%)'
              : 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.95), rgba(190,210,235,0.6) 55%, rgba(120,155,190,0.35) 100%)',
            boxShadow: onDark
              ? '0 0 48px rgba(220,235,255,0.35), inset 0 0 24px rgba(255,255,255,0.2)'
              : '0 0 40px rgba(180,200,230,0.45), inset 0 0 20px rgba(255,255,255,0.35)',
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
