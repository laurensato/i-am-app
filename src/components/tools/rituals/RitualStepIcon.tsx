'use client'

import { Sun } from '@phosphor-icons/react'
import BreathworkOrb from '@/components/BreathworkOrb'
import FactorIcon from '@/components/FactorIcon'
import JournalWritingIcon from '@/components/JournalWritingIcon'
import VisualizationWaveIcon from '@/components/VisualizationWaveIcon'
import type { RitualStepDefinition } from '@/lib/ritual'

type Props = {
  step: RitualStepDefinition
  size?: number
}

export default function RitualStepIcon({ step, size = 40 }: Props) {
  if (step.icon === 'overview') {
    return <Sun size={size} weight="thin" style={{ color: 'var(--text-secondary)' }} />
  }

  if (step.icon === 'factor' && step.factor) {
    return <FactorIcon factor={step.factor} size={size} weight="thin" />
  }

  if (step.icon === 'journal') {
    return <JournalWritingIcon size={size} variant="default" animated={false} />
  }

  if (step.icon === 'breathwork') {
    return (
      <BreathworkOrb
        size={size}
        variant="default"
        animated={false}
        pattern={step.breathworkPattern ?? 'square'}
      />
    )
  }

  if (step.icon === 'visualization') {
    return <VisualizationWaveIcon size={size} variant="default" animated={false} />
  }

  return null
}
