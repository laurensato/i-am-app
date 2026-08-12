'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import BreathworkOrb from '@/components/BreathworkOrb'
import BreathworkToolFocusShell from './BreathworkToolFocusShell'
import { useBreathPhaseSequence } from '@/hooks/useBreathPhaseSequence'
import {
  CALMING_CYCLES,
  CALMING_PHASES,
  CALMING_SESSION_MS,
  formatBreathworkDuration,
} from '@/lib/breathwork'

const calmingDuration = formatBreathworkDuration(CALMING_SESSION_MS)

type SessionState = 'idle' | 'active' | 'complete'

export default function CalmingToolCard() {
  const [sessionState, setSessionState] = useState<SessionState>('idle')
  const [sessionKey, setSessionKey] = useState(0)

  const { phaseLabel, cycle, stepIndex } = useBreathPhaseSequence(
    sessionState === 'active',
    sessionKey,
    CALMING_PHASES,
    CALMING_CYCLES
  )

  function startSession() {
    setSessionKey(k => k + 1)
    setSessionState('active')
  }

  function handleComplete() {
    setSessionState('complete')
  }

  function closeSession() {
    setSessionState('idle')
  }

  const focused = sessionState !== 'idle'

  return (
    <BreathworkToolFocusShell focused={focused} onClose={closeSession} placeholderMinHeight={220}>
      <div
        id="calming"
        className={`breathwork-tool-card flex flex-col items-center p-4 min-h-[220px] scroll-mt-24${focused ? ' breathwork-tool-card--expanded' : ''}`}
        style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}
      >
      <h2
        className="text-sm font-normal mb-1 self-start w-full"
        style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
      >
        Calming
      </h2>
      <p
        className="text-[11px] font-light leading-relaxed mb-3 self-start w-full"
        style={{ color: 'var(--text-muted)' }}
      >
        The 4-7-8 technique — inhale quietly through your nose for 4 counts, hold for 7, exhale forcefully through your mouth with a whoosh for 8. {CALMING_CYCLES} cycles, about {calmingDuration}.
      </p>

      <div className="flex-1 flex flex-col items-center justify-center w-full gap-3">
        <BreathworkOrb
          key={sessionKey}
          size={focused ? 120 : 96}
          variant="default"
          pattern="fourSevenEight"
          animated={sessionState !== 'complete'}
          rounds={sessionState === 'active' ? CALMING_CYCLES : undefined}
          onComplete={handleComplete}
        />

        {sessionState === 'active' && (
          <div className="flex flex-col items-center gap-1 min-h-[2.5rem]" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.p
                key={`${sessionKey}-${stepIndex}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.35 }}
                className="text-[10px] tracking-[0.2em] uppercase font-light"
                style={{ color: 'var(--text-muted)' }}
              >
                {phaseLabel}
              </motion.p>
            </AnimatePresence>
            <p className="text-[10px] font-light" style={{ color: 'var(--text-muted)' }}>
              Cycle {cycle} of {CALMING_CYCLES}
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
