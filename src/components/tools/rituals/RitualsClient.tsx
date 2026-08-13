'use client'

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import RitualStepCard, { RitualInsertSlot } from '@/components/tools/rituals/RitualStepCard'
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
  readRitualDragPayload,
  removeRitualStep,
  resolveRitualSteps,
  saveRitualLayout,
  setRitualStepComplete,
  type RitualDragPayload,
  type RitualStepId,
} from '@/lib/ritual'
import { todayDateKey } from '@/lib/journalReading'
import type { IdentityFactor } from '@/lib/types'

type Props = {
  factors: IdentityFactor[]
  userId: string
  profile: { first_name: string; age: number; gender: string } | null
}

export default function RitualsClient({ factors, userId, profile }: Props) {
  const librarySteps = useMemo(() => getAllRitualLibrarySteps(), [])

  // SSR-safe defaults — localStorage is loaded after mount to avoid hydration mismatch.
  const [ritualStepIds, setRitualStepIds] = useState<RitualStepId[]>(() =>
    getDefaultRitualStepIds(factors),
  )

  const [completed, setCompleted] = useState<Set<RitualStepId>>(() => new Set())

  useEffect(() => {
    const layout = normalizeRitualLayout(loadRitualLayout(userId), factors)
    const dateKey = todayDateKey()
    setRitualStepIds(layout)
    setCompleted(loadRitualProgress(userId, layout, dateKey))
    // Load persisted layout once on mount; factors come from the server page props.
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

  const [draggingId, setDraggingId] = useState<RitualStepId | null>(null)
  const [dropIndex, setDropIndexState] = useState<number | null>(null)
  const dragPayloadRef = useRef<RitualDragPayload | null>(null)
  const dropIndexRef = useRef<number | null>(null)
  const dropHandledRef = useRef(false)

  const [runnerOpen, setRunnerOpen] = useState(false)

  function setDropIndex(index: number | null) {
    dropIndexRef.current = index
    setDropIndexState(index)
  }

  const persistLayout = useCallback(
    (next: RitualStepId[]) => {
      saveRitualLayout(userId, next)
      setRitualStepIds(next)
    },
    [userId],
  )

  function readDragPayload(dataTransfer: DataTransfer | null): RitualDragPayload | null {
    if (dataTransfer) {
      const fromTransfer = readRitualDragPayload(dataTransfer)
      if (fromTransfer) return fromTransfer
    }
    return dragPayloadRef.current
  }

  function startDrag(payload: RitualDragPayload) {
    dropHandledRef.current = false
    dragPayloadRef.current = payload
    setDraggingId(payload.stepId)
  }

  function clearDragState() {
    dragPayloadRef.current = null
    dropIndexRef.current = null
    dropHandledRef.current = false
    setDraggingId(null)
    setDropIndex(null)
  }

  function handleDropAt(index: number, dataTransfer: DataTransfer | null) {
    const payload = readDragPayload(dataTransfer)
    if (!payload) return

    if (payload.source === 'library') {
      if (!isRitualStepEligible(payload.stepId, factors)) return
      setRitualStepIds(current => {
        if (current.includes(payload.stepId)) return current
        const next = insertRitualStep(current, payload.stepId, index)
        saveRitualLayout(userId, next)
        return next
      })
      return
    }

    setRitualStepIds(current => {
      if (!current.includes(payload.stepId)) return current
      const next = insertRitualStep(current, payload.stepId, index)
      if (next.length === current.length && next.every((id, i) => id === current[i])) {
        return current
      }
      saveRitualLayout(userId, next)
      return next
    })
  }

  function commitDrop(index: number, dataTransfer: DataTransfer | null) {
    if (dropHandledRef.current) return
    dropHandledRef.current = true
    handleDropAt(index, dataTransfer)
  }

  function dropAtIndex(index: number, dataTransfer: DataTransfer) {
    commitDrop(index, dataTransfer)
    finishDragSession()
  }

  function finishDragSession() {
    window.setTimeout(() => {
      if (
        !dropHandledRef.current &&
        dropIndexRef.current !== null &&
        dragPayloadRef.current
      ) {
        commitDrop(dropIndexRef.current, null)
      }
      clearDragState()
    }, 0)
  }

  function renderInsertSlot(index: number) {
    return (
      <RitualInsertSlot
        key={`insert-${index}`}
        index={index}
        isActive={dropIndex === index}
        onDragOver={setDropIndex}
        onDrop={dropAtIndex}
      />
    )
  }

  function handleDropOnLibrary(dataTransfer: DataTransfer) {
    const payload = readDragPayload(dataTransfer)
    if (!payload || payload.source !== 'carousel') return
    dropHandledRef.current = true
    setRitualStepIds(current => {
      if (!current.includes(payload.stepId)) return current
      const next = removeRitualStep(current, payload.stepId)
      saveRitualLayout(userId, next)
      return next
    })
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

  function closeRunner() {
    setRunnerOpen(false)
  }

  function toggleStep(stepId: RitualStepId) {
    const dateKey = todayDateKey()
    setCompleted(current => {
      const next = new Set(current)
      if (next.has(stepId)) {
        next.delete(stepId)
        setRitualStepComplete(userId, stepId, false, dateKey)
      } else {
        next.add(stepId)
        setRitualStepComplete(userId, stepId, true, dateKey)
      }
      return next
    })
  }

  const completedCount = activeSteps.filter(step => completed.has(step.id)).length

  return (
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
          Tap Begin to move through today&apos;s steps in a guided flow, or swipe the carousel to browse.
          Drag cards to reorder your ritual — your order is saved automatically.
        </p>
      </div>

      <EtherealProgressBar completed={completedCount} total={activeSteps.length} />

      <section aria-label="Your ritual steps">
        {activeSteps.length === 0 ? (
          <div
            className="flex items-center justify-center px-6 border border-dashed text-center transition-colors"
            style={{
              width: 120,
              height: 120,
              borderColor: dropIndex === 0 ? 'var(--text-primary)' : 'var(--parchment)',
              backgroundColor: 'var(--warm-white)',
            }}
            onDragOver={event => {
              event.preventDefault()
              setDropIndex(0)
            }}
            onDragLeave={() => setDropIndex(null)}
            onDrop={event => {
              event.preventDefault()
              dropAtIndex(0, event.dataTransfer)
            }}
          >
            <p className="text-sm font-light max-w-xs" style={{ color: 'var(--text-muted)' }}>
              Drag a step from the library below to begin your ritual.
            </p>
          </div>
        ) : (
          <div
            className={`-mx-2 px-2 flex overflow-x-auto snap-x snap-mandatory pb-4 scroll-px-2 items-center${
              draggingId === null ? ' gap-3' : ''
            }`}
            style={{ scrollbarWidth: 'thin' }}
            onDragOver={event => {
              if (draggingId === null) return
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
            }}
            onDrop={event => {
              if (draggingId === null || dropIndexRef.current === null) return
              event.preventDefault()
              dropAtIndex(dropIndexRef.current, event.dataTransfer)
            }}
            onDragLeave={event => {
              if (event.currentTarget === event.target) setDropIndex(null)
            }}
          >
            <RitualBeginButton onClick={beginRitual} disabled={draggingId !== null} />

            {activeSteps.map((step, index) => (
              <Fragment key={step.id}>
                {draggingId !== null && renderInsertSlot(index)}
                <RitualStepCard
                  variant="carousel"
                  step={step}
                  done={completed.has(step.id)}
                  isDragging={draggingId === step.id}
                  onToggle={() => toggleStep(step.id)}
                  onDragStart={stepId =>
                    startDrag({ stepId, source: 'carousel' })
                  }
                  onDragEnd={finishDragSession}
                />
              </Fragment>
            ))}

            {draggingId !== null && renderInsertSlot(activeSteps.length)}
          </div>
        )}
      </section>

      <RitualRunnerModal
        open={runnerOpen}
        onClose={closeRunner}
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
              Drag a card into your ritual above, or tap to add it to the end. Drag a ritual step here
              to remove it.
            </p>
          </div>

          <div
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 justify-items-center py-4 px-1"
            onDragOver={event => {
              event.preventDefault()
            }}
            onDrop={event => {
              event.preventDefault()
              handleDropOnLibrary(event.dataTransfer)
              finishDragSession()
            }}
          >
            {librarySteps.map(step => {
              const inRitual = ritualStepIds.includes(step.id)
              const eligible = isRitualStepEligible(step.id, factors)
              const disabled = inRitual || !eligible

              return (
                <RitualStepCard
                  key={step.id}
                  variant="library"
                  step={step}
                  disabled={disabled}
                  isDragging={draggingId === step.id}
                  onDragStart={stepId =>
                    startDrag({ stepId, source: 'library' })
                  }
                  onDragEnd={finishDragSession}
                  onAdd={() => addStep(step.id)}
                />
              )
            })}
          </div>
          {availableSteps.length === 0 && ritualStepIds.length > 0 && (
            <p className="text-xs font-light text-center" style={{ color: 'var(--text-muted)' }}>
              Every step available to you is already in your ritual.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
