'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CaretRight, X } from '@phosphor-icons/react'
import EtherealProgressBar from '@/components/tools/rituals/EtherealProgressBar'
import RitualCelebrationView from '@/components/tools/rituals/RitualCelebrationView'
import RitualStepContent, { type RitualStepContentHandle } from '@/components/tools/rituals/RitualStepContent'
import type { RitualStepDefinition, RitualStepId } from '@/lib/ritual'
import type { IdentityFactor } from '@/lib/types'

type Profile = { first_name: string; age: number; gender: string } | null

type Props = {
  open: boolean
  onClose: () => void
  steps: RitualStepDefinition[]
  factors: IdentityFactor[]
  userId: string
  profile: Profile
  onStepComplete: (stepId: RitualStepId) => void
}

const slideTransition = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1] as const,
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 56 : -56,
    opacity: 0,
    filter: 'blur(10px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -56 : 56,
    opacity: 0,
    filter: 'blur(10px)',
  }),
}

type Phase = 'running' | 'celebration'

export default function RitualRunnerModal({
  open,
  onClose,
  steps,
  factors,
  userId,
  profile,
  onStepComplete,
}: Props) {
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<Phase>('running')
  const [stepIndex, setStepIndex] = useState(0)
  const [slideDirection, setSlideDirection] = useState(1)
  const [completedInSession, setCompletedInSession] = useState(0)
  const contentRef = useRef<RitualStepContentHandle>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    setPhase('running')
    setStepIndex(0)
    setSlideDirection(1)
    setCompletedInSession(0)
  }, [open])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  function handleClose() {
    if (phase === 'celebration') {
      onClose()
      return
    }
    onClose()
  }

  function finishRitual() {
    setPhase('celebration')
  }

  function advanceStep() {
    if (steps.length === 0) return

    const current = steps[stepIndex]
    onStepComplete(current.id)
    setCompletedInSession(count => count + 1)

    if (stepIndex >= steps.length - 1) {
      finishRitual()
      return
    }

    setSlideDirection(1)
    setStepIndex(stepIndex + 1)
  }

  function handleNext() {
    if (phase === 'celebration') return

    const subStepHandled = contentRef.current?.tryAdvanceSubStep()
    if (subStepHandled) return

    advanceStep()
  }

  const currentStep = steps[stepIndex]
  const isLastStep = stepIndex >= steps.length - 1

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6"
          style={{ backgroundColor: 'color-mix(in srgb, var(--text-primary) 44%, transparent)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          role="dialog"
          aria-modal
          aria-labelledby="ritual-runner-title"
        >
          <motion.div
            className="relative flex w-full max-w-lg max-h-[min(92vh,720px)] flex-col overflow-hidden border ritual-runner-step-glow"
            style={{
              borderColor: 'color-mix(in srgb, var(--parchment) 70%, white)',
              backgroundColor: 'var(--warm-white)',
              boxShadow: '0 24px 64px color-mix(in srgb, var(--text-primary) 20%, transparent)',
            }}
            initial={{ opacity: 0, y: 20, scale: 0.97, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(4px)' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="flex items-center justify-between gap-3 px-5 py-4 border-b shrink-0"
              style={{ borderColor: 'var(--parchment)' }}
            >
              <div className="min-w-0">
                <p
                  id="ritual-runner-title"
                  className="text-[10px] font-medium tracking-widest uppercase"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {phase === 'celebration' ? 'Ritual complete' : 'Daily ritual'}
                </p>
                {phase === 'running' && steps.length > 0 && (
                  <p className="text-xs font-light mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Step {stepIndex + 1} of {steps.length}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="shrink-0 flex items-center justify-center rounded-full p-1.5 transition-opacity hover:opacity-70"
                style={{
                  color: 'var(--text-muted)',
                  backgroundColor: 'color-mix(in srgb, var(--parchment) 35%, transparent)',
                }}
                aria-label="Close ritual"
              >
                <X size={16} weight="regular" />
              </button>
            </div>

            {phase === 'running' && (
              <div className="px-5 pt-3 shrink-0">
                <EtherealProgressBar completed={completedInSession} total={steps.length} />
              </div>
            )}

            <div className="relative flex-1 overflow-y-auto px-5 py-5 min-h-0">
              <AnimatePresence mode="wait" custom={slideDirection}>
                {phase === 'celebration' ? (
                  <motion.div
                    key="celebration"
                    custom={slideDirection}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={slideTransition}
                    className="relative ritual-celebration-panel rounded-sm"
                  >
                    <RitualCelebrationView onClose={onClose} />
                  </motion.div>
                ) : currentStep ? (
                  <motion.div
                    key={currentStep.id}
                    custom={slideDirection}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={slideTransition}
                  >
                    <RitualStepContent
                      ref={contentRef}
                      step={currentStep}
                      factors={factors}
                      userId={userId}
                      profile={profile}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {phase === 'running' && (
              <div
                className="flex items-center justify-end gap-3 px-5 py-4 border-t shrink-0"
                style={{ borderColor: 'var(--parchment)' }}
              >
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium tracking-wide uppercase transition-opacity hover:opacity-85"
                  style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-text)' }}
                >
                  {isLastStep ? 'Finish' : 'Next'}
                  <CaretRight size={16} weight="regular" />
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
