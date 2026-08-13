'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import RitualStepCard from '@/components/tools/rituals/RitualStepCard'
import type { RitualStepDefinition } from '@/lib/ritual'

type Props = {
  step: RitualStepDefinition
  done: boolean
}

export default function SortableRitualStepCard({ step, done }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: step.id,
    data: { type: 'carousel', stepId: step.id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : undefined,
    zIndex: isDragging ? 10 : undefined,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="snap-center shrink-0 touch-manipulation"
      {...attributes}
      {...listeners}
    >
      <RitualStepCard
        variant="carousel"
        step={step}
        done={done}
        isDragging={isDragging}
      />
    </div>
  )
}
