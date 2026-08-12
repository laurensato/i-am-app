'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, DotsSixVertical } from '@phosphor-icons/react'
import RitualStepIcon from '@/components/tools/rituals/RitualStepIcon'
import { writeRitualDragPayload, type RitualStepDefinition, type RitualStepId } from '@/lib/ritual'

export const RITUAL_CARD_SIZE_PX = 120

type BaseProps = {
  step: RitualStepDefinition
  done?: boolean
  isDragging?: boolean
}

type CarouselProps = BaseProps & {
  variant: 'carousel'
  onToggle: () => void
  onDragStart: (stepId: RitualStepId) => void
  onDragEnd: () => void
}

type LibraryProps = BaseProps & {
  variant: 'library'
  disabled?: boolean
  onAdd: () => void
  onDragStart: (stepId: RitualStepId) => void
  onDragEnd: () => void
}

type Props = CarouselProps | LibraryProps

export default function RitualStepCard(props: Props) {
  const { step, done = false, isDragging = false, variant } = props

  const cardBody = (
    <>
      <div className="flex items-center justify-center shrink-0" style={{ height: 44 }}>
        <RitualStepIcon step={step} size={40} />
      </div>
      <span
        className="text-[10px] font-medium leading-tight text-center line-clamp-2 w-full"
        style={{
          fontFamily: 'var(--font-serif)',
          color: 'var(--text-primary)',
          opacity: done ? 0.72 : 1,
        }}
      >
        {step.shortLabel}
      </span>
    </>
  )

  if (variant === 'library') {
    const disabled = props.disabled ?? false

    const cardStyle = {
      width: RITUAL_CARD_SIZE_PX,
      height: RITUAL_CARD_SIZE_PX,
      borderColor: 'var(--parchment)',
      backgroundColor: 'var(--warm-white)',
      opacity: disabled ? 0.42 : isDragging ? 0.5 : 1,
      boxShadow: '0 4px 14px color-mix(in srgb, var(--text-primary) 5%, transparent)',
    }

    return (
      <button
        type="button"
        draggable={!disabled}
        disabled={disabled}
        onClick={() => {
          if (!disabled) props.onAdd()
        }}
        onDragStart={event => {
          if (disabled) {
            event.preventDefault()
            return
          }
          writeRitualDragPayload(event.dataTransfer, { stepId: step.id, source: 'library' })
          props.onDragStart(step.id)
        }}
        onDragEnd={props.onDragEnd}
        className="relative shrink-0 flex flex-col items-center justify-center gap-2 p-3 border transition-all disabled:cursor-not-allowed"
        style={{
          ...cardStyle,
          cursor: disabled ? 'not-allowed' : 'grab',
        }}
        aria-label={
          disabled
            ? `${step.label} — already in your ritual or unavailable`
            : `Add ${step.label} to your ritual`
        }
      >
        {cardBody}
      </button>
    )
  }

  const router = useRouter()
  const draggedRef = useRef(false)
  const [allowDropThrough, setAllowDropThrough] = useState(false)

  useEffect(() => {
    if (!isDragging) {
      setAllowDropThrough(false)
      return
    }
    const frame = requestAnimationFrame(() => setAllowDropThrough(true))
    return () => cancelAnimationFrame(frame)
  }, [isDragging])

  return (
    <article
      draggable
      onDragStart={event => {
        draggedRef.current = true
        writeRitualDragPayload(event.dataTransfer, { stepId: step.id, source: 'carousel' })
        props.onDragStart(step.id)
      }}
      onDragEnd={() => {
        props.onDragEnd()
        window.setTimeout(() => {
          draggedRef.current = false
        }, 0)
      }}
      onClick={event => {
        if (draggedRef.current) return
        if (event.shiftKey) {
          event.preventDefault()
          props.onToggle()
          return
        }
        router.push(step.href)
      }}
      className="snap-center shrink-0 relative border transition-all cursor-grab active:cursor-grabbing select-none"
      style={{
        width: RITUAL_CARD_SIZE_PX,
        height: RITUAL_CARD_SIZE_PX,
        borderColor: 'var(--parchment)',
        backgroundColor: done
          ? 'color-mix(in srgb, var(--selected-bg) 65%, var(--warm-white))'
          : 'var(--warm-white)',
        opacity: isDragging ? 0.45 : 1,
        pointerEvents: allowDropThrough ? 'none' : 'auto',
        boxShadow: '0 4px 14px color-mix(in srgb, var(--text-primary) 5%, transparent)',
      }}
      aria-label={`${step.label}. Drag to reorder.`}
      title={`Open ${step.label}. Shift-click to mark complete.`}
    >
      <div
        className="absolute top-1.5 right-1.5 z-10 flex items-center justify-center rounded-full pointer-events-none"
        style={{
          width: 22,
          height: 22,
          backgroundColor: 'color-mix(in srgb, var(--parchment) 50%, var(--warm-white))',
        }}
        aria-hidden
      >
        <DotsSixVertical size={12} weight="bold" style={{ color: 'var(--text-muted)' }} />
      </div>

      {done && (
        <span
          className="absolute top-1.5 left-1.5 flex items-center justify-center rounded-full pointer-events-none"
          style={{
            width: 20,
            height: 20,
            backgroundColor: 'var(--text-primary)',
            color: 'var(--warm-white)',
          }}
        >
          <Check size={11} weight="bold" />
        </span>
      )}

      <div className="flex flex-col items-center justify-center gap-2 h-full w-full p-3 pt-4 pointer-events-none">
        {cardBody}
      </div>
    </article>
  )
}

export function RitualInsertSlot({
  index,
  isActive,
  onDragOver,
  onDrop,
}: {
  index: number
  isActive: boolean
  onDragOver: (index: number) => void
  onDrop: (index: number, dataTransfer: DataTransfer) => void
}) {
  return (
    <div
      className="snap-center shrink-0 flex items-center justify-center self-stretch relative"
      style={{ width: 18, minHeight: RITUAL_CARD_SIZE_PX, zIndex: 20 }}
      onDragEnter={event => {
        event.preventDefault()
      }}
      onDragOver={event => {
        event.preventDefault()
        event.stopPropagation()
        event.dataTransfer.dropEffect = 'move'
        onDragOver(index)
      }}
      onDrop={event => {
        event.preventDefault()
        event.stopPropagation()
        onDrop(index, event.dataTransfer)
      }}
      aria-hidden
    >
      <div
        className="rounded-full transition-all duration-150"
        style={{
          width: isActive ? 3 : 2,
          height: isActive ? 88 : 52,
          backgroundColor: isActive
            ? 'var(--text-primary)'
            : 'color-mix(in srgb, var(--text-primary) 28%, transparent)',
          opacity: isActive ? 1 : 0.5,
          boxShadow: isActive
            ? '0 0 10px color-mix(in srgb, var(--text-primary) 22%, transparent)'
            : undefined,
        }}
      />
    </div>
  )
}
