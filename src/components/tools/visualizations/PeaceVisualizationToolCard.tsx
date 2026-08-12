import StepVisualizationToolCard from './StepVisualizationToolCard'
import { PEACE_VISUALIZATION_STEPS } from '@/lib/visualizations'

export default function PeaceVisualizationToolCard() {
  return (
    <StepVisualizationToolCard
      title="Peace"
      description="Follow the rhythm of the tide to release tension and return to calm. Move through each step at your own pace."
      steps={PEACE_VISUALIZATION_STEPS}
    />
  )
}
