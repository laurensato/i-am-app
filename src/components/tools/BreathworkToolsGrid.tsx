'use client'

import GroundingToolCard from './GroundingToolCard'
import CalmingToolCard from './CalmingToolCard'
import EnergyBoostToolCard from './EnergyBoostToolCard'
import WellnessToolCard from './WellnessToolCard'
import DestressToolCard from './DestressToolCard'
import PeaceToolCard from './PeaceToolCard'

export default function BreathworkToolsGrid() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <GroundingToolCard />
      <CalmingToolCard />
      <EnergyBoostToolCard />
      <WellnessToolCard />
      <DestressToolCard />
      <PeaceToolCard />
    </div>
  )
}
