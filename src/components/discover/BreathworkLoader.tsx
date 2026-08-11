'use client'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import BreathworkOrb from '@/components/BreathworkOrb'
import {
  BREATH_PHASE_MS,
  MIN_BREATH_MS,
  SQUARE_BREATH_PHASES,
} from '@/lib/breathwork'

export { BREATH_PHASE_MS, MIN_BREATH_MS }

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
      setPhaseIndex(i => (i + 1) % SQUARE_BREATH_PHASES.length)
    }, BREATH_PHASE_MS)
    return () => clearInterval(id)
  }, [])

  const phase = SQUARE_BREATH_PHASES[phaseIndex]

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <p
        className="text-center text-sm font-light leading-relaxed mb-10 max-w-xs"
        style={{ fontFamily: 'var(--font-serif)', color: messageColor }}
      >
        {message}
      </p>

      <div className="mb-6">
        <BreathworkOrb size={168} variant={onDark ? 'onDark' : 'default'} animated />
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
