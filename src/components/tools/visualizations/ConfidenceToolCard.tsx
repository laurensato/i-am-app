import StepVisualizationToolCard from './StepVisualizationToolCard'
import { CONFIDENCE_STEPS } from '@/lib/visualizations'

export default function ConfidenceToolCard() {
  return (
    <StepVisualizationToolCard
      anchorId="confidence"
      title="Confidence"
      description="Help your body learn how to feel successful before you start something challenging. Move through each step at your own pace."
      steps={CONFIDENCE_STEPS}
    />
  )
}
