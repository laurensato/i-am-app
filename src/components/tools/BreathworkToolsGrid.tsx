'use client'

import AddToRitualButton from '@/components/rituals/AddToRitualButton'
import GroundingToolCard from './GroundingToolCard'
import CalmingToolCard from './CalmingToolCard'
import EnergyBoostToolCard from './EnergyBoostToolCard'
import WellnessToolCard from './WellnessToolCard'
import DestressToolCard from './DestressToolCard'
import PeaceToolCard from './PeaceToolCard'
import type { RitualStepId } from '@/lib/ritual'
import type { IdentityFactor } from '@/lib/types'

const TOOLS: { Component: () => React.JSX.Element; stepId: RitualStepId }[] = [
  { Component: GroundingToolCard, stepId: 'breathwork_grounding' },
  { Component: CalmingToolCard, stepId: 'breathwork_calming' },
  { Component: EnergyBoostToolCard, stepId: 'breathwork_energy_boost' },
  { Component: WellnessToolCard, stepId: 'breathwork_wellness' },
  { Component: DestressToolCard, stepId: 'breathwork_destress' },
  { Component: PeaceToolCard, stepId: 'breathwork_peace' },
]

type Props = {
  userId: string
  factors: IdentityFactor[]
}

export default function BreathworkToolsGrid({ userId, factors }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {TOOLS.map(({ Component, stepId }) => (
        <div key={stepId} className="relative">
          <AddToRitualButton
            userId={userId}
            stepId={stepId}
            factors={factors}
            className="absolute top-3 right-3 z-10"
          />
          <Component />
        </div>
      ))}
    </div>
  )
}
