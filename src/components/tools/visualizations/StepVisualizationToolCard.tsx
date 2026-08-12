'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from '@phosphor-icons/react'
import VisualizationWaveIcon from '@/components/VisualizationWaveIcon'
import BreathworkToolFocusShell from '../BreathworkToolFocusShell'
import type { VisualizationStep } from '@/lib/visualizations'

type SessionState = 'idle' | 'active' | 'complete'

const stepTransition = {
  initial: { opacity: 0, filter: 'blur(6px)', y: 6 },
  animate: { opacity: 1, filter: 'blur(0px)', y: 0 },
  exit: { opacity: 0, filter: 'blur(6px)', y: -6 },
  transition: { duration: 0.9, ease: 'easeInOut' as const },
}

type Props = {
  title: string
  description: string
  steps: VisualizationStep[]
}

export default function StepVisualizationToolCard({ title, description, steps }: Props) {
  const [sessionState, setSessionState] = useState<SessionState>('idle')
  const [sessionKey, setSessionKey] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)

  const focused = sessionState !== 'idle'
  const step = steps[stepIndex]
  const isLastStep = stepIndex >= steps.length - 1

  function startSession() {
    setSessionKey(k => k + 1)
    setStepIndex(0)
    setSessionState('active')
  }

  function closeSession() {
    setSessionState('idle')
    setStepIndex(0)
  }

  function nextStep() {
    if (isLastStep) {
      setSessionState('complete')
      return
    }
    setStepIndex(i => i + 1)
  }

  return (
    <BreathworkToolFocusShell focused={focused} onClose={closeSession} placeholderMinHeight={280}>
      <div
        className={`visualization-tool-card flex flex-col items-center p-4 min-h-[280px]${focused ? ' visualization-tool-card--expanded' : ''}`}
        style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}
      >
        <h2
          className="text-sm font-normal mb-1 self-start w-full"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
        >
          {title}
        </h2>
        <p
          className="text-[11px] font-light leading-relaxed mb-3 self-start w-full"
          style={{ color: 'var(--text-muted)' }}
        >
          {description}
        </p>

        <div
          className="relative flex-1 flex flex-col items-center justify-center w-full gap-3"
          style={{ minHeight: sessionState === 'active' ? 148 : undefined }}
          aria-live={sessionState === 'active' ? 'polite' : undefined}
        >
          {sessionState !== 'active' && (
            <VisualizationWaveIcon size={focused ? 120 : 96} variant="default" animated />
          )}

          {sessionState === 'active' && step && (
            <>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <VisualizationWaveIcon size={focused ? 120 : 96} variant="default" animated />
              </div>

              <div className="relative z-10 flex flex-col items-center justify-center px-1 min-h-[132px] w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${sessionKey}-${stepIndex}`}
                    {...stepTransition}
                    className="px-3 py-2 text-center max-w-[14rem]"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--warm-white) 78%, transparent)',
                    }}
                  >
                    <p
                      className="text-[10px] tracking-[0.15em] uppercase font-light mb-2"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {step.title}
                    </p>
                    <p
                      className="text-[11px] font-light leading-relaxed"
                      style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-serif)' }}
                    >
                      {step.text}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <p
                  className="relative z-10 mt-3 text-[10px] font-light"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Step {stepIndex + 1} of {steps.length}
                </p>
              </div>
            </>
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

        {sessionState === 'active' && (
          <button
            type="button"
            onClick={nextStep}
            className="w-full py-2.5 text-xs font-medium mt-2 flex items-center justify-center gap-1.5"
            style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-text)' }}
          >
            {isLastStep ? 'Finish' : 'Next'}
            <ArrowRight size={14} weight="regular" />
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
