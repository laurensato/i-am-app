import StepVisualizationToolCard from './StepVisualizationToolCard'
import { MINDFUL_CLOUDS_STEPS } from '@/lib/visualizations'

export default function MindfulCloudsToolCard() {
  return (
    <StepVisualizationToolCard
      title="Mindful Clouds"
      description="Release ruminations by placing thoughts on clouds and watching them drift away. Move through each step at your own pace."
      steps={MINDFUL_CLOUDS_STEPS}
    />
  )
}
