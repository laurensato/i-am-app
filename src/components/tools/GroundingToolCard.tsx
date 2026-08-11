'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import BreathworkOrb from '@/components/BreathworkOrb'
import BreathworkToolFocusShell from './BreathworkToolFocusShell'
import {
  BREATH_PHASE_MS,
  GROUNDING_ROUNDS,
  GROUNDING_SESSION_MS,
  SQUARE_BREATH_PHASES,
  formatBreathworkDuration,
} from '@/lib/breathwork'

const groundingDuration = formatBreathworkDuration(GROUNDING_SESSION_MS)

type SessionState = 'idle' | 'active' | 'complete'

export default function GroundingToolCard() {
  const [sessionState, setSessionState] = useState<SessionState>('idle')
  const [sessionKey, setSessionKey] = useState(0)
  const [phaseStep, setPhaseStep] = useState(0)

  const phase = SQUARE_BREATH_PHASES[phaseStep % SQUARE_BREATH_PHASES.length]
  const round = Math.min(GROUNDING_ROUNDS, Math.floor(phaseStep / SQUARE_BREATH_PHASES.length) + 1)

  useEffect(() => {
    if (sessionState !== 'active') return

    let step = 0
    const id = setInterval(() => {
      step += 1
      if (step >= GROUNDING_ROUNDS * SQUARE_BREATH_PHASES.length) {
        clearInterval(id)
        return
      }
      setPhaseStep(step)
    }, BREATH_PHASE_MS)

    return () => clearInterval(id)
  }, [sessionState, sessionKey])

  function startSession() {
    setPhaseStep(0)
    setSessionKey(k => k + 1)
    setSessionState('active')
  }

  function handleComplete() {
    setSessionState('complete')
  }

  function closeSession() {
    setSessionState('idle')
    setPhaseStep(0)
  }

  const focused = sessionState !== 'idle'

  return (
    <BreathworkToolFocusShell focused={focused} onClose={closeSession} placeholderMinHeight={220}>
      <div
        className={`breathwork-tool-card flex flex-col items-center p-4 min-h-[220px]${focused ? ' breathwork-tool-card--expanded' : ''}`}
        style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}
      >
      <h2
        className="text-sm font-normal mb-1 self-start w-full"
        style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
      >
        Grounding
      </h2>
      <p
        className="text-[11px] font-light leading-relaxed mb-3 self-start w-full"
        style={{ color: 'var(--text-muted)' }}
      >
        Square breathing — inhale, hold, exhale, and hold, each for four counts. {GROUNDING_ROUNDS} rounds, about {groundingDuration}.
      </p>

      <div className="flex-1 flex flex-col items-center justify-center w-full gap-3">
        <BreathworkOrb
          key={sessionKey}
          size={focused ? 120 : 96}
          variant="default"
          animated={sessionState !== 'complete'}
          rounds={sessionState === 'active' ? GROUNDING_ROUNDS : undefined}
          onComplete={handleComplete}
        />

        {sessionState === 'active' && (
          <div className="flex flex-col items-center gap-1 min-h-[2.5rem]" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.p
                key={`${sessionKey}-${phaseStep}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.35 }}
                className="text-[10px] tracking-[0.2em] uppercase font-light"
                style={{ color: 'var(--text-muted)' }}
              >
                {phase}
              </motion.p>
            </AnimatePresence>
            <p className="text-[10px] font-light" style={{ color: 'var(--text-muted)' }}>
              Round {round} of {GROUNDING_ROUNDS}
            </p>
          </div>
        )}

        {sessionState === 'complete' && (
          <p className="text-xs font-light text-center" style={{ color: 'var(--text-secondary)' }}>
            Complete
          </p>
        )}
      </div>

      {sessionState === 'idle' && (
        <button
          type="button"
          onClick={startSession}
          className="w-full py-2.5 text-xs font-medium mt-2"
          style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-text)' }}
        >
          Start
        </button>
      )}

      {sessionState === 'complete' && (
        <button
          type="button"
          onClick={startSession}
          className="w-full py-2.5 text-xs font-medium mt-2"
          style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-text)' }}
        >
          Start again
        </button>
      )}
    </div>
    </BreathworkToolFocusShell>
  )
}
