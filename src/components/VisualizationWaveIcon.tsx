'use client'

import { useId } from 'react'

type Props = {
  size?: number
  animated?: boolean
  variant?: 'default' | 'onDark'
}

export default function VisualizationWaveIcon({
  size = 64,
  animated = true,
  variant = 'default',
}: Props) {
  const id = useId().replace(/:/g, '')
  const onDark = variant === 'onDark'
  const prefix = `viz-wave-${id}`

  const strokePrimary = onDark ? 'rgba(255,255,255,0.72)' : 'rgba(150,185,220,0.88)'
  const strokeMid = onDark ? 'rgba(210,228,248,0.48)' : 'rgba(175,200,235,0.62)'
  const strokeSoft = onDark ? 'rgba(190,215,240,0.28)' : 'rgba(190,210,235,0.38)'
  const glow = onDark ? 'rgba(220,235,255,0.35)' : 'rgba(160,190,225,0.45)'

  return (
    <div
      className="relative flex items-center justify-center shrink-0 pointer-events-none"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.92,
          height: size * 0.92,
          background: onDark
            ? 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(190,210,235,0.06) 45%, transparent 72%)'
            : 'radial-gradient(circle, rgba(190,210,235,0.34) 0%, rgba(165,195,225,0.14) 50%, transparent 74%)',
          filter: `blur(${Math.max(6, size * 0.12)}px)`,
        }}
      />
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative overflow-visible"
      >
        <defs>
          <linearGradient id={`${prefix}-a`} x1="0" y1="0" x2="64" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={strokeSoft} stopOpacity="0" />
            <stop offset="35%" stopColor={strokePrimary} />
            <stop offset="65%" stopColor={strokePrimary} />
            <stop offset="100%" stopColor={strokeSoft} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${prefix}-b`} x1="0" y1="0" x2="64" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={strokeSoft} stopOpacity="0" />
            <stop offset="40%" stopColor={strokeMid} />
            <stop offset="60%" stopColor={strokeMid} />
            <stop offset="100%" stopColor={strokeSoft} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${prefix}-c`} x1="0" y1="0" x2="64" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={strokeSoft} stopOpacity="0" />
            <stop offset="45%" stopColor={strokeSoft} />
            <stop offset="55%" stopColor={strokeSoft} />
            <stop offset="100%" stopColor={strokeSoft} stopOpacity="0" />
          </linearGradient>
          <filter id={`${prefix}-blur`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter={`url(#${prefix}-blur)`}>
          <path
            className={animated ? 'viz-wave-line viz-wave-line-c' : undefined}
            d="M-12 40 C4 34, 12 46, 28 40 S52 34, 76 40"
            stroke={`url(#${prefix}-c)`}
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            className={animated ? 'viz-wave-line viz-wave-line-b' : undefined}
            d="M-12 32 C6 26, 18 38, 32 32 S58 26, 76 32"
            stroke={`url(#${prefix}-b)`}
            strokeWidth="2.25"
            strokeLinecap="round"
          />
          <path
            className={animated ? 'viz-wave-line viz-wave-line-a' : undefined}
            d="M-12 24 C8 18, 16 30, 32 24 S56 18, 76 24"
            stroke={`url(#${prefix}-a)`}
            strokeWidth="2.75"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
          />
        </g>
      </svg>
    </div>
  )
}
