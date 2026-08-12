'use client'

import AddToRitualButton from '@/components/rituals/AddToRitualButton'
import WorryJarToolCard from './WorryJarToolCard'
import MindfulCloudsToolCard from './MindfulCloudsToolCard'
import ConfidenceToolCard from './ConfidenceToolCard'
import PeaceVisualizationToolCard from './PeaceVisualizationToolCard'
import type { RitualStepId } from '@/lib/ritual'
import type { IdentityFactor } from '@/lib/types'

const TOOLS: { Component: () => React.JSX.Element; stepId: RitualStepId }[] = [
  { Component: WorryJarToolCard, stepId: 'visualization_worry_jar' },
  { Component: MindfulCloudsToolCard, stepId: 'visualization_mindful_clouds' },
  { Component: ConfidenceToolCard, stepId: 'visualization_confidence' },
  { Component: PeaceVisualizationToolCard, stepId: 'visualization_peace' },
]

type Props = {
  userId: string
  factors: IdentityFactor[]
}

export default function VisualizationsToolsGrid({ userId, factors }: Props) {
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
