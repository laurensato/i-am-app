'use client'

import { useEffect, useRef } from 'react'
import type { BreathOrbPattern } from '@/lib/breathwork'

type Props = {
  size?: number
  /** Light background (dashboard) vs dark navy card */
  variant?: 'default' | 'onDark'
  animated?: boolean
  pattern?: BreathOrbPattern
  /** When set, animation runs this many cycles then stops */
  rounds?: number
  onComplete?: () => void
}

function orbClassPrefix(pattern: BreathOrbPattern): string {
  if (pattern === 'fourSevenEight') return 'breath-orb-478'
  if (pattern === 'sixTwo') return 'breath-orb-62'
  if (pattern === 'wellness') return 'breath-orb-wellness'
  return 'breath-orb'
}

function layerClass(layer: 'core' | 'mid' | 'halo', animated: boolean, pattern: BreathOrbPattern) {
  if (!animated) return 'absolute rounded-full'
  return `${orbClassPrefix(pattern)}-${layer} absolute rounded-full`
}

export default function BreathworkOrb({
  size = 168,
  variant = 'onDark',
  animated = true,
  pattern = 'square',
  rounds,
  onComplete,
}: Props) {
  const onDark = variant === 'onDark'
  const scale = size / 168
  const rootRef = useRef<HTMLDivElement>(null)

  const haloSize = Math.round(168 * scale)
  const midSize = Math.round(120 * scale)
  const coreSize = Math.round(88 * scale)
  const coreBlur = Math.max(3, Math.round(8 * scale))
  const midBlur = Math.max(5, Math.round(11 * scale))
  const haloBlur = Math.max(7, Math.round(18 * scale))

  const finiteAnimation = rounds != null && animated
    ? {
        animationIterationCount: rounds,
        animationFillMode: 'forwards' as const,
      }
    : undefined

  useEffect(() => {
    if (!rounds || !animated || !onComplete) return
    const core = rootRef.current?.querySelector(
      '.breath-orb-core, .breath-orb-478-core, .breath-orb-62-core, .breath-orb-wellness-core'
    )
    if (!core) return
    const handleEnd = () => onComplete()
    core.addEventListener('animationend', handleEnd)
    return () => core.removeEventListener('animationend', handleEnd)
  }, [rounds, animated, onComplete, pattern])

  return (
    <div
      ref={rootRef}
      className="relative flex items-center justify-center shrink-0 pointer-events-none"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div
        className={layerClass('halo', animated, pattern)}
        style={{
          width: haloSize,
          height: haloSize,
          background: onDark
            ? 'radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(190,210,235,0.08) 30%, transparent 62%)'
            : 'radial-gradient(circle, rgba(175,200,230,0.62) 0%, rgba(147,180,210,0.32) 35%, transparent 68%)',
          filter: `blur(${haloBlur}px)`,
          ...finiteAnimation,
        }}
      />
      <div
        className={layerClass('mid', animated, pattern)}
        style={{
          width: midSize,
          height: midSize,
          background: onDark
            ? 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(210,225,245,0.1) 40%, transparent 68%)'
            : 'radial-gradient(circle, rgba(210,228,248,0.54) 0%, rgba(165,195,225,0.28) 45%, transparent 72%)',
          filter: `blur(${midBlur}px)`,
          ...finiteAnimation,
        }}
      />
      <div
        className={layerClass('core', animated, pattern)}
        style={{
          width: coreSize,
          height: coreSize,
          background: onDark
            ? 'radial-gradient(circle at 50% 48%, rgba(255,255,255,0.9) 0%, rgba(225,238,252,0.56) 28%, rgba(190,215,235,0.2) 52%, transparent 72%)'
            : 'radial-gradient(circle at 50% 48%, rgba(255,255,255,1) 0%, rgba(195,218,242,0.82) 28%, rgba(150,185,215,0.42) 52%, transparent 74%)',
          filter: `blur(${coreBlur}px)`,
          boxShadow: onDark
            ? '0 0 56px rgba(220,235,255,0.44), 0 0 96px rgba(180,205,230,0.24)'
            : '0 0 52px rgba(175,200,235,0.78), 0 0 88px rgba(140,175,210,0.44)',
          ...finiteAnimation,
        }}
      />
    </div>
  )
}
