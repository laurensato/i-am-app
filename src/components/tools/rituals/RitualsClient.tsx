'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import RitualStepCard from '@/components/tools/rituals/RitualStepCard'
import SortableRitualStepCard from '@/components/tools/rituals/SortableRitualStepCard'
import DraggableLibraryStepCard from '@/components/tools/rituals/DraggableLibraryStepCard'
import EtherealProgressBar from '@/components/tools/rituals/EtherealProgressBar'
import { RitualBeginButton } from '@/components/tools/rituals/RitualRunnerControls'
import RitualRunnerModal from '@/components/tools/rituals/RitualRunnerModal'
import {
  getAllRitualLibrarySteps,
  getDefaultRitualStepIds,
  insertRitualStep,
  isRitualStepEligible,
  loadRitualLayout,
  loadRitualProgress,
  normalizeRitualLayout,
  removeRitualStep,
  resolveRitualSteps,
  saveRitualLayout,
  setRitualStepComplete,
  type RitualStepDefinition,
  type RitualStepId,
} from '@/lib/ritual'
import { todayDateKey } from '@/lib/journalReading'
import type { IdentityFactor } from '@/lib/types'

type ActiveDrag = {
  step: RitualStepDefinition
  source: 'carousel' | 'library'
}

function EmptyCarouselDrop({ isDragging }: { isDragging: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'carousel-drop' })

  return (
    <div
      ref={setNodeRef}
      className="flex items-center justify-center px-6 border border-dashed text-center transition-colors snap-center shrink-0"
      style={{
        width: 120,
        height: 120,
        borderColor: isOver && isDragging ? 'var(--text-primary)' : 'var(--parchment)',
        backgroundColor: isOver && isDragging
          ? 'color-mix(in srgb, var(--selected-bg) 40%, var(--warm-white))'
          : 'var(--warm-white)',
      }}
    >
      <p className="text-sm font-light max-w-xs" style={{ color: 'var(--text-muted)' }}>
        {isDragging ? 'Drop here to add' : 'Drag a step from the library below to begin your ritual.'}
      </p>
    </div>
  )
}

function LibraryDropZone({
  children,
  isDraggingFromCarousel,
}: {
  children: ReactNode
  isDraggingFromCarousel: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'library-drop' })

  return (
    <div
      ref={setNodeRef}
      className="rounded-lg transition-colors"
      style={{
        outline:
          isOver && isDraggingFromCarousel
            ? '2px dashed var(--text-primary)'
            : undefined,
        outlineOffset: 4,
      }}
    >
      {children}
    </div>
  )
}

type Props = {
  factors: IdentityFactor[]
  userId: string
  profile: { first_name: string; age: number; gender: string } | null
}

export default function RitualsClient({ factors, userId, profile }: Props) {
  const librarySteps = useMemo(() => getAllRitualLibrarySteps(), [])

  const [ritualStepIds, setRitualStepIds] = useState<RitualStepId[]>(() =>
    getDefaultRitualStepIds(factors),
  )

  const [completed, setCompleted] = useState<Set<RitualStepId>>(() => new Set())
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const [runnerOpen, setRunnerOpen] = useState(false)

  useEffect(() => {
    const layout = normalizeRitualLayout(loadRitualLayout(userId), factors)
    const dateKey = todayDateKey()
    setRitualStepIds(layout)
    setCompleted(loadRitualProgress(userId, layout, dateKey))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const activeSteps = useMemo(
    () => resolveRitualSteps(ritualStepIds, factors),
    [ritualStepIds, factors],
  )

  const availableSteps = useMemo(
    () =>
      librarySteps.filter(
        step =>
          isRitualStepEligible(step.id, factors) && !ritualStepIds.includes(step.id),
      ),
    [librarySteps, factors, ritualStepIds],
  )

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 220,
        tolerance: 8,
      },
    }),
  )

  const persistLayout = useCallback(
    (next: RitualStepId[]) => {
      saveRitualLayout(userId, next)
      setRitualStepIds(next)
    },
    [userId],
  )

  function resolveCarouselInsertIndex(overId: string | number): number {
    if (overId === 'carousel-drop') return 0
    const overStepId = String(overId) as RitualStepId
    const index = ritualStepIds.indexOf(overStepId)
    return index >= 0 ? index : ritualStepIds.length
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current
    if (data?.type === 'carousel') {
      const step = activeSteps.find(item => item.id === data.stepId)
      if (step) setActiveDrag({ step, source: 'carousel' })
      return
    }
    if (data?.type === 'library') {
      const step = librarySteps.find(item => item.id === data.stepId)
      if (step) setActiveDrag({ step, source: 'library' })
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveDrag(null)

    if (!over) return

    const activeData = active.data.current
    const overId = String(over.id)

    if (activeData?.type === 'carousel') {
      const overData = over.data.current
      const droppedOnLibrary =
        overId === 'library-drop' || overData?.type === 'library'

      if (droppedOnLibrary) {
        const stepId = activeData.stepId as RitualStepId
        persistLayout(removeRitualStep(ritualStepIds, stepId))
        return
      }
    }

    if (activeData?.type === 'library') {
      const overData = over.data.current
      if (overData?.type === 'library' || overId === 'library-drop') return

      const stepId = activeData.stepId as RitualStepId
      if (!isRitualStepEligible(stepId, factors) || ritualStepIds.includes(stepId)) return

      const insertIndex = resolveCarouselInsertIndex(over.id)
      persistLayout(insertRitualStep(ritualStepIds, stepId, insertIndex))
      return
    }

    if (activeData?.type === 'carousel' && over.data.current?.type === 'carousel') {
      const activeId = activeData.stepId as RitualStepId
      const overStepId = overId as RitualStepId
      const oldIndex = ritualStepIds.indexOf(activeId)
      const newIndex = ritualStepIds.indexOf(overStepId)
      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        persistLayout(arrayMove(ritualStepIds, oldIndex, newIndex))
      }
    }
  }

  function addStep(stepId: RitualStepId) {
    if (!isRitualStepEligible(stepId, factors) || ritualStepIds.includes(stepId)) return
    persistLayout(insertRitualStep(ritualStepIds, stepId, ritualStepIds.length))
  }

  function markStepComplete(stepId: RitualStepId) {
    const dateKey = todayDateKey()
    setCompleted(current => {
      if (current.has(stepId)) return current
      const next = new Set(current)
      next.add(stepId)
      setRitualStepComplete(userId, stepId, true, dateKey)
      return next
    })
  }

  function beginRitual() {
    if (activeSteps.length === 0) return
    setRunnerOpen(true)
  }

  const completedCount = activeSteps.filter(step => completed.has(step.id)).length
  const isDragging = activeDrag !== null
  const isDraggingFromCarousel = activeDrag?.source === 'carousel'

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      autoScroll
    >
      <div className="flex flex-col gap-8">
        <div>
          <h1
            className="text-2xl font-normal mb-3"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
          >
            My Daily Ritual
          </h1>
          <p
            className="text-sm font-light leading-relaxed max-w-xl"
            style={{ color: 'var(--text-muted)' }}
          >
            Tap Begin to move through today&apos;s steps in a guided flow, or swipe the carousel to
            browse. Press and hold a step to reorder — tap a library card to add it quickly.
          </p>
        </div>

        <EtherealProgressBar completed={completedCount} total={activeSteps.length} />

        <section aria-label="Your ritual steps">
          {activeSteps.length === 0 ? (
            <EmptyCarouselDrop isDragging={isDragging && activeDrag?.source === 'library'} />
          ) : (
            <div
              className="-mx-2 px-2 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 scroll-px-2 items-center"
              style={{ scrollbarWidth: 'thin' }}
            >
              <RitualBeginButton onClick={beginRitual} disabled={isDragging} />

              <SortableContext
                items={ritualStepIds}
                strategy={horizontalListSortingStrategy}
              >
                {activeSteps.map(step => (
                  <SortableRitualStepCard
                    key={step.id}
                    step={step}
                    done={completed.has(step.id)}
                  />
                ))}
              </SortableContext>
            </div>
          )}
        </section>

        <RitualRunnerModal
          open={runnerOpen}
          onClose={() => setRunnerOpen(false)}
          steps={activeSteps}
          factors={factors}
          userId={userId}
          profile={profile}
          onStepComplete={markStepComplete}
        />

        <section aria-label="Add ritual steps">
          <div className="flex flex-col gap-3">
            <div>
              <p
                className="text-[11px] font-medium tracking-widest uppercase mb-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Add to your ritual
              </p>
              <p className="text-xs font-light" style={{ color: 'var(--text-muted)' }}>
                Tap to add, or drag into your ritual. Drag a step here to remove it.
              </p>
            </div>

            <LibraryDropZone isDraggingFromCarousel={isDraggingFromCarousel}>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 justify-items-center py-4 px-1">
                {librarySteps.map(step => {
                  const inRitual = ritualStepIds.includes(step.id)
                  const eligible = isRitualStepEligible(step.id, factors)
                  const disabled = inRitual || !eligible

                  return (
                    <DraggableLibraryStepCard
                      key={step.id}
                      step={step}
                      disabled={disabled}
                      onAdd={() => addStep(step.id)}
                    />
                  )
                })}
              </div>
            </LibraryDropZone>

            {availableSteps.length === 0 && ritualStepIds.length > 0 && (
              <p className="text-xs font-light text-center" style={{ color: 'var(--text-muted)' }}>
                Every step available to you is already in your ritual.
              </p>
            )}
          </div>
        </section>
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }} modifiers={[restrictToHorizontalAxis]}>
        {activeDrag ? (
          activeDrag.source === 'library' ? (
            <DraggableLibraryStepCard
              step={activeDrag.step}
              disabled={false}
              onAdd={() => {}}
              isDragOverlay
            />
          ) : (
            <RitualStepCard
              variant="carousel"
              step={activeDrag.step}
              done={completed.has(activeDrag.step.id)}
              isDragOverlay
            />
          )
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
