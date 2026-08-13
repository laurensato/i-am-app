'use client'

import { Check, DotsSixVertical } from '@phosphor-icons/react'
import RitualStepIcon from '@/components/tools/rituals/RitualStepIcon'
import type { RitualStepDefinition } from '@/lib/ritual'

export const RITUAL_CARD_SIZE_PX = 120

type CarouselProps = {
  variant: 'carousel'
  step: RitualStepDefinition
  done?: boolean
  isDragging?: boolean
  isDragOverlay?: boolean
}

type LibraryProps = {
  variant: 'library'
  step: RitualStepDefinition
  disabled?: boolean
  isDragging?: boolean
  isDragOverlay?: boolean
  onAdd: () => void
}

type Props = CarouselProps | LibraryProps

export default function RitualStepCard(props: Props) {
  const { step, isDragging = false, isDragOverlay = false } = props
  const done = props.variant === 'carousel' ? (props.done ?? false) : false
  const disabled = props.variant === 'library' ? (props.disabled ?? false) : false

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

  const cardStyle = {
    width: RITUAL_CARD_SIZE_PX,
    height: RITUAL_CARD_SIZE_PX,
    borderColor: isDragOverlay ? 'var(--text-primary)' : 'var(--parchment)',
    backgroundColor:
      props.variant === 'carousel' && done
        ? 'color-mix(in srgb, var(--selected-bg) 65%, var(--warm-white))'
        : 'var(--warm-white)',
    opacity: disabled ? 0.42 : isDragging ? 0.5 : 1,
    boxShadow: isDragOverlay
      ? '0 16px 40px color-mix(in srgb, var(--text-primary) 18%, transparent)'
      : '0 4px 14px color-mix(in srgb, var(--text-primary) 5%, transparent)',
    scale: isDragOverlay ? '1.04' : undefined,
  }

  if (props.variant === 'library') {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) props.onAdd()
        }}
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
        {!disabled && (
          <div
            className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-full pointer-events-none"
            style={{
              width: 22,
              height: 22,
              backgroundColor: 'color-mix(in srgb, var(--parchment) 50%, var(--warm-white))',
            }}
            aria-hidden
          >
            <DotsSixVertical size={12} weight="bold" style={{ color: 'var(--text-muted)' }} />
          </div>
        )}
        {cardBody}
      </button>
    )
  }

  return (
    <article
      className="relative border select-none"
      style={cardStyle}
      aria-label={`${step.label}. Drag to reorder.`}
    >
      <div
        className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-full pointer-events-none"
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
