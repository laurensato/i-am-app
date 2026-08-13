'use client'

import { CaretRight } from '@phosphor-icons/react'
import RitualSunriseIcon from '@/components/RitualSunriseIcon'
import { RITUAL_CARD_SIZE_PX } from '@/components/tools/rituals/RitualStepCard'

export function RitualBeginButton({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="snap-center shrink-0 flex flex-col items-center justify-center gap-2 p-3 border transition-all disabled:cursor-not-allowed disabled:opacity-45 hover:opacity-90"
      style={{
        width: RITUAL_CARD_SIZE_PX,
        height: RITUAL_CARD_SIZE_PX,
        borderColor: 'var(--text-primary)',
        backgroundColor: 'color-mix(in srgb, var(--selected-bg) 35%, var(--warm-white))',
        boxShadow: '0 4px 18px color-mix(in srgb, var(--text-primary) 8%, transparent)',
      }}
      aria-label="Begin my daily ritual"
    >
      <RitualSunriseIcon size={36} variant="default" animated />
      <span
        className="text-[9px] font-medium leading-tight text-center px-1"
        style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
      >
        Begin My Daily Ritual
      </span>
    </button>
  )
}

export function RitualNextButton({
  onClick,
  isLast,
}: {
  onClick: () => void
  isLast: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="snap-center shrink-0 flex flex-col items-center justify-center gap-1.5 border transition-all hover:opacity-90"
      style={{
        width: RITUAL_CARD_SIZE_PX,
        height: RITUAL_CARD_SIZE_PX,
        borderColor: 'var(--parchment)',
        backgroundColor: 'var(--warm-white)',
        boxShadow: '0 4px 14px color-mix(in srgb, var(--text-primary) 5%, transparent)',
      }}
      aria-label={isLast ? 'Finish ritual' : 'Next ritual step'}
    >
      <span
        className="flex items-center justify-center rounded-full"
        style={{
          width: 40,
          height: 40,
          backgroundColor: 'color-mix(in srgb, var(--parchment) 45%, var(--warm-white))',
          color: 'var(--text-primary)',
        }}
      >
        <CaretRight size={22} weight="regular" />
      </span>
      <span
        className="text-[9px] font-medium tracking-wide uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        {isLast ? 'Finish' : 'Next'}
      </span>
    </button>
  )
}
