'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import RitualStepIcon from '@/components/tools/rituals/RitualStepIcon'
import type { RitualStepDefinition } from '@/lib/ritual'

const slideTransition = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1] as const,
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 72 : -72,
    opacity: 0,
    filter: 'blur(10px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -72 : 72,
    opacity: 0,
    filter: 'blur(10px)',
  }),
}

type Props = {
  step: RitualStepDefinition
  stepIndex: number
  totalSteps: number
  direction: number
  done: boolean
}

export default function RitualRunnerStepView({
  step,
  stepIndex,
  totalSteps,
  direction,
  done,
}: Props) {
  return (
    <motion.div
      key={step.id}
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={slideTransition}
      className="w-full max-w-md mx-auto px-2"
    >
      <div
        className="relative flex flex-col items-center gap-4 p-6 border text-center ritual-runner-step-glow"
        style={{
          borderColor: done ? 'var(--text-primary)' : 'var(--parchment)',
          backgroundColor: done
            ? 'color-mix(in srgb, var(--selected-bg) 50%, var(--warm-white))'
            : 'var(--warm-white)',
          boxShadow: '0 8px 28px color-mix(in srgb, var(--text-primary) 7%, transparent)',
        }}
      >
        <p
          className="text-[10px] font-medium tracking-widest uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          Step {stepIndex + 1} of {totalSteps}
        </p>

        <div className="flex items-center justify-center" style={{ height: 56 }}>
          <RitualStepIcon step={step} size={52} />
        </div>

        <div className="flex flex-col gap-1.5">
          <h2
            className="text-lg font-normal"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
          >
            {step.label}
          </h2>
          <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {step.description}
          </p>
        </div>

        <Link
          href={step.href}
          className="text-xs font-medium tracking-wide uppercase transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-secondary)' }}
        >
          Open this step →
        </Link>
      </div>
    </motion.div>
  )
}
