'use client'

import { useDraggable } from '@dnd-kit/core'
import RitualStepCard from '@/components/tools/rituals/RitualStepCard'
import type { RitualStepDefinition, RitualStepId } from '@/lib/ritual'

type Props = {
  step: RitualStepDefinition
  disabled: boolean
  onAdd: () => void
  isDragOverlay?: boolean
}

export default function DraggableLibraryStepCard({
  step,
  disabled,
  onAdd,
  isDragOverlay,
}: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library:${step.id}`,
    disabled,
    data: { type: 'library', stepId: step.id as RitualStepId },
  })

  if (isDragOverlay) {
    return (
      <RitualStepCard variant="library" step={step} isDragOverlay onAdd={onAdd} />
    )
  }

  return (
    <div
      ref={setNodeRef}
      className="relative shrink-0 touch-manipulation"
      {...(!disabled ? { ...attributes, ...listeners } : {})}
    >
      <RitualStepCard
        variant="library"
        step={step}
        disabled={disabled}
        isDragging={isDragging}
        onAdd={onAdd}
      />
    </div>
  )
}
