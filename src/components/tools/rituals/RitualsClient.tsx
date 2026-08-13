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
import {
  hasExceededDragThreshold,
  resolveRitualDropIndex,
} from '@/lib/ritualPointerDrag'
import type { IdentityFactor } from '@/lib/types'

function isPointInElement(clientX: number, clientY: number, element: HTMLElement | null): boolean {
  if (!element) return false
  const rect = element.getBoundingClientRect()
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  )
}

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

  const carouselRef = useRef<HTMLDivElement>(null)
  const libraryRef = useRef<HTMLDivElement>(null)
  const pointerDragRef = useRef<{
    pointerId: number
    captureEl: HTMLElement
    payload: RitualDragPayload
    active: boolean
  } | null>(null)

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

  function beginPointerDrag(payload: RitualDragPayload, event: React.PointerEvent<HTMLElement>) {
    const captureEl = event.currentTarget
    const pointerId = event.pointerId

    pointerDragRef.current = {
      pointerId,
      captureEl,
      payload,
      active: false,
    }

    const startX = event.clientX
    const startY = event.clientY

    const onPointerMove = (moveEvent: PointerEvent) => {
      const session = pointerDragRef.current
      if (!session || moveEvent.pointerId !== pointerId) return

      if (!session.active) {
        if (!hasExceededDragThreshold(startX, startY, moveEvent.clientX, moveEvent.clientY)) {
          return
        }
        session.active = true
        captureEl.setPointerCapture(pointerId)
        startDrag(payload)
      }

      moveEvent.preventDefault()
      const index = resolveRitualDropIndex(moveEvent.clientX, carouselRef.current)
      if (index !== null) setDropIndex(index)
    }

    const onPointerEnd = (endEvent: PointerEvent) => {
      const session = pointerDragRef.current
      if (!session || endEvent.pointerId !== pointerId) return

      if (captureEl.hasPointerCapture(pointerId)) {
        captureEl.releasePointerCapture(pointerId)
      }
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerEnd)
      window.removeEventListener('pointercancel', onPointerEnd)
      pointerDragRef.current = null

      if (!session.active) return

      const droppedOnLibrary = isPointInElement(
        endEvent.clientX,
        endEvent.clientY,
        libraryRef.current,
      )

      if (session.payload.source === 'carousel' && droppedOnLibrary) {
        dropHandledRef.current = true
        setRitualStepIds(current => {
          if (!current.includes(session.payload.stepId)) return current
          const next = removeRitualStep(current, session.payload.stepId)
          saveRitualLayout(userId, next)
          return next
        })
        clearDragState()
        return
      }

      finishDragSession()
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerEnd)
    window.addEventListener('pointercancel', onPointerEnd)
  }

  function renderInsertSlot(index: number) {
    return (
      <RitualInsertSlot
        key={`insert-${index}`}
        index={index}
        isActive={dropIndex === index}
        onDragOver={setDropIndex}
        onDrop={dropAtIndex}
        onPointerDragOver={draggingId !== null ? setDropIndex : undefined}
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
          Drag cards to reorder your ritual — press and drag on touch, or grab with a mouse.
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
            ref={carouselRef}
            className={`-mx-2 px-2 flex overflow-x-auto snap-x snap-mandatory pb-4 scroll-px-2 items-center${
              draggingId === null ? ' gap-3' : ''
            }`}
            style={{
              scrollbarWidth: 'thin',
              touchAction: draggingId !== null ? 'none' : 'pan-x',
            }}
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
                  onDragStart={stepId =>
                    startDrag({ stepId, source: 'carousel' })
                  }
                  onDragEnd={finishDragSession}
                  onPointerDragStart={event =>
                    beginPointerDrag({ stepId: step.id, source: 'carousel' }, event)
                  }
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
              Drop on the library below to remove a step.
            </p>
          </div>

          <div
            ref={libraryRef}
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
                  dragSessionActive={draggingId !== null}
                  onDragStart={stepId =>
                    startDrag({ stepId, source: 'library' })
                  }
                  onDragEnd={finishDragSession}
                  onPointerDragStart={
                    disabled
                      ? undefined
                      : event =>
                          beginPointerDrag({ stepId: step.id, source: 'library' }, event)
                  }
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
