'use client'

import { useCallback, useEffect, useState } from 'react'
import RitualSunriseIcon from '@/components/RitualSunriseIcon'
import {
  RITUAL_LAYOUT_CHANGED_EVENT,
  addStepToRitualLayout,
  getRitualStepDefinition,
  isRitualStepEligible,
  isStepInRitualLayout,
  type RitualStepId,
} from '@/lib/ritual'
import type { IdentityFactor } from '@/lib/types'

type Props = {
  userId: string
  stepId: RitualStepId
  factors: IdentityFactor[]
  variant?: 'default' | 'onDark'
  className?: string
}

export default function AddToRitualButton({
  userId,
  stepId,
  factors,
  variant = 'default',
  className,
}: Props) {
  const [inRitual, setInRitual] = useState(false)
  const eligible = isRitualStepEligible(stepId, factors)
  const step = getRitualStepDefinition(stepId)

  const sync = useCallback(() => {
    setInRitual(isStepInRitualLayout(userId, stepId))
  }, [userId, stepId])

  useEffect(() => {
    sync()
    function onLayoutChanged(event: Event) {
      const detail = (event as CustomEvent<{ userId: string }>).detail
      if (!detail || detail.userId === userId) sync()
    }
    window.addEventListener(RITUAL_LAYOUT_CHANGED_EVENT, onLayoutChanged)
    window.addEventListener('focus', sync)
    return () => {
      window.removeEventListener(RITUAL_LAYOUT_CHANGED_EVENT, onLayoutChanged)
      window.removeEventListener('focus', sync)
    }
  }, [sync, userId])

  function add() {
    if (!eligible || inRitual) return
    const result = addStepToRitualLayout(userId, stepId, factors)
    if (result.ok || result.reason === 'already_in_ritual') {
      setInRitual(true)
    }
  }

  const tooltip = !eligible
    ? 'Not available for your ritual yet'
    : inRitual
      ? 'In your ritual'
      : `Add ${step.shortLabel} to ritual`

  const onDark = variant === 'onDark'
  const iconSize = onDark ? 32 : 36

  return (
    <button
      type="button"
      onClick={add}
      disabled={!eligible || inRitual}
      aria-label={tooltip}
      className={
        className ??
        'group relative flex items-center justify-center rounded-full transition-opacity hover:opacity-90 disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2'
      }
      style={{
        width: 40,
        height: 40,
        outlineColor: onDark ? 'rgba(255,255,255,0.4)' : undefined,
      }}
    >
      <RitualSunriseIcon
        size={iconSize}
        variant={variant}
        animated={!inRitual && eligible}
      />
      <span
        className="pointer-events-none absolute right-full mr-2 top-1/2 z-10 max-w-[220px] -translate-y-1/2 whitespace-normal rounded px-2.5 py-1.5 text-[11px] font-medium leading-snug opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{
          backgroundColor: 'var(--warm-white)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--parchment)',
          boxShadow: '0 4px 12px color-mix(in srgb, var(--text-primary) 12%, transparent)',
        }}
        role="tooltip"
      >
        {tooltip}
      </span>
    </button>
  )
}
