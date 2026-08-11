'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import BreathworkOrb from '@/components/BreathworkOrb'
import BreathworkToolFocusShell from './BreathworkToolFocusShell'
import {
  PEACE_INSTRUCTIONS,
  PEACE_SESSION_MS,
  WELLNESS_STEP_MS,
  formatBreathworkDuration,
} from '@/lib/breathwork'

const peaceDuration = formatBreathworkDuration(PEACE_SESSION_MS)

type SessionState = 'idle' | 'active' | 'complete'
type ActivePhase = 'instruct' | 'free'

const instructionTransition = {
  initial: { opacity: 0, filter: 'blur(6px)', y: 6 },
  animate: { opacity: 1, filter: 'blur(0px)', y: 0 },
  exit: { opacity: 0, filter: 'blur(6px)', y: -6 },
  transition: { duration: 0.9, ease: 'easeInOut' as const },
}

export default function PeaceToolCard() {
  const [sessionState, setSessionState] = useState<SessionState>('idle')
  const [sessionKey, setSessionKey] = useState(0)
  const [activePhase, setActivePhase] = useState<ActivePhase>('instruct')
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (sessionState !== 'active') return

    setActivePhase('instruct')
    setStepIndex(0)

    const timeouts: ReturnType<typeof setTimeout>[] = []

    for (let i = 1; i < PEACE_INSTRUCTIONS.length; i += 1) {
      timeouts.push(setTimeout(() => setStepIndex(i), i * WELLNESS_STEP_MS))
    }

    timeouts.push(setTimeout(() => {
      setActivePhase('free')
    }, PEACE_INSTRUCTIONS.length * WELLNESS_STEP_MS))

    timeouts.push(setTimeout(() => {
      setSessionState('complete')
    }, PEACE_SESSION_MS))

    return () => timeouts.forEach(clearTimeout)
  }, [sessionState, sessionKey])

  function startSession() {
    setSessionKey(k => k + 1)
    setSessionState('active')
  }

  function closeSession() {
    setSessionState('idle')
    setActivePhase('instruct')
    setStepIndex(0)
  }

  const orbAnimated = sessionState === 'idle' || sessionState === 'active'

  const focused = sessionState !== 'idle'

  return (
    <BreathworkToolFocusShell focused={focused} onClose={closeSession} placeholderMinHeight={280}>
      <div
        className={`breathwork-tool-card flex flex-col items-center p-4 min-h-[280px]${focused ? ' breathwork-tool-card--expanded' : ''}`}
        style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}
      >
      <h2
        className="text-sm font-normal mb-1 self-start w-full"
        style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
      >
        Peace
      </h2>
      <p
        className="text-[11px] font-light leading-relaxed mb-3 self-start w-full"
        style={{ color: 'var(--text-muted)' }}
      >
        Humming breath — follow each guided step for six counts, then breathe with the orb for five minutes. About {peaceDuration}.
      </p>

      <div className="flex-1 flex flex-col items-center justify-center w-full gap-3">
        <div
          className="relative w-full flex items-center justify-center"
          style={{ minHeight: 132 }}
          aria-live={sessionState === 'active' ? 'polite' : undefined}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <BreathworkOrb
              key={sessionKey}
              size={focused ? 148 : 120}
              variant="default"
              pattern="wellness"
              animated={orbAnimated}
            />
          </div>

          {sessionState === 'active' && activePhase === 'instruct' && (
            <div className="relative z-10 flex items-center justify-center px-1 min-h-[132px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${sessionKey}-${stepIndex}`}
                  {...instructionTransition}
                  className="px-3 py-2 text-center max-w-[13rem]"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--warm-white) 78%, transparent)',
                  }}
                >
                  <p
                    className="text-[11px] font-light leading-relaxed"
                    style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-serif)' }}
                  >
                    {PEACE_INSTRUCTIONS[stepIndex]}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {sessionState === 'active' && activePhase === 'free' && (
            <motion.p
              initial={{ opacity: 0, filter: 'blur(6px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="relative z-10 text-[10px] font-light tracking-[0.15em] uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              Keep breathing
            </motion.p>
          )}
        </div>

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
