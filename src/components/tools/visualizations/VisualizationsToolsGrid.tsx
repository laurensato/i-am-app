'use client'

import WorryJarToolCard from './WorryJarToolCard'
import MindfulCloudsToolCard from './MindfulCloudsToolCard'
import ConfidenceToolCard from './ConfidenceToolCard'
import PeaceVisualizationToolCard from './PeaceVisualizationToolCard'

export default function VisualizationsToolsGrid() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <WorryJarToolCard />
      <MindfulCloudsToolCard />
      <ConfidenceToolCard />
      <PeaceVisualizationToolCard />
    </div>
  )
}
