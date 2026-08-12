import StepVisualizationToolCard from './StepVisualizationToolCard'
import { WORRY_JAR_STEPS } from '@/lib/visualizations'

export default function WorryJarToolCard() {
  return (
    <StepVisualizationToolCard
      anchorId="worry-jar"
      title="Worry Jar"
      description="Contain a worry in an imaginary jar so you can set it aside for now. Move through each step at your own pace."
      steps={WORRY_JAR_STEPS}
    />
  )
}
