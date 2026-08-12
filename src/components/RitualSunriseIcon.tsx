'use client'

import { useId } from 'react'

type Props = {
  size?: number
  animated?: boolean
  variant?: 'default' | 'onDark'
}

export default function RitualSunriseIcon({
  size = 64,
  animated = true,
  variant = 'default',
}: Props) {
  const id = useId().replace(/:/g, '')
  const onDark = variant === 'onDark'
  const prefix = `ritual-sunrise-${id}`

  const strokePrimary = onDark ? 'rgba(255,255,255,0.72)' : 'rgba(150,185,220,0.78)'
  const strokeMid = onDark ? 'rgba(210,228,248,0.42)' : 'rgba(175,200,235,0.52)'
  const strokeSoft = onDark ? 'rgba(190,215,240,0.24)' : 'rgba(190,210,235,0.32)'
  const fillWarm = onDark ? 'rgba(255, 228, 170, 0.42)' : 'rgba(255, 236, 190, 0.55)'
  const glowWarm = onDark ? 'rgba(255, 214, 140, 0.32)' : 'rgba(255, 210, 130, 0.4)'
  const glowCool = onDark ? 'rgba(220,235,255,0.35)' : 'rgba(160,190,225,0.45)'
  const sunCore = onDark ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.96)'

  const ambientClass = animated ? 'ritual-sunrise-ambient' : undefined
  const sunClass = animated ? 'ritual-sunrise-sun' : undefined
  const raysClass = animated ? 'ritual-sunrise-rays' : undefined
  const skyClass = animated ? 'ritual-sunrise-sky' : undefined
  const horizonClass = animated ? 'ritual-sunrise-horizon' : undefined

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
      <div
        className={ambientClass}
        style={{
          position: 'absolute',
          width: size * 0.72,
          height: size * 0.72,
          borderRadius: '50%',
          background: onDark
            ? `radial-gradient(circle, ${glowWarm} 0%, rgba(255,255,255,0.06) 50%, transparent 72%)`
            : `radial-gradient(circle, ${glowWarm} 0%, rgba(255,248,230,0.14) 52%, transparent 74%)`,
          filter: `blur(${Math.max(10, size * 0.16)}px)`,
          opacity: animated ? undefined : 0.75,
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
          <radialGradient id={`${prefix}-sun`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={sunCore} />
            <stop offset="38%" stopColor={fillWarm} stopOpacity="0.55" />
            <stop offset="68%" stopColor={strokePrimary} stopOpacity="0.62" />
            <stop offset="100%" stopColor={strokeMid} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${prefix}-sky`} x1="32" y1="8" x2="32" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={strokeMid} stopOpacity="0.42" />
            <stop offset="55%" stopColor={strokeSoft} stopOpacity="0.28" />
            <stop offset="100%" stopColor={strokeSoft} stopOpacity="0" />
          </linearGradient>
          <filter id={`${prefix}-soft`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter={`url(#${prefix}-soft)`}>
          <ellipse
            className={skyClass}
            cx="32"
            cy="24"
            rx="24"
            ry="18"
            fill={`url(#${prefix}-sky)`}
          />

          <g className={raysClass} style={{ transformOrigin: '32px 36px' }}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
              <line
                key={angle}
                x1="32"
                y1="36"
                x2={32 + Math.cos((angle * Math.PI) / 180) * 18}
                y2={36 + Math.sin((angle * Math.PI) / 180) * 18}
                stroke={strokeMid}
                strokeWidth="1"
                strokeLinecap="round"
                opacity="0.45"
              />
            ))}
          </g>

          <path
            className={horizonClass}
            d="M8 44 C16 40, 24 46, 32 44 C40 42, 48 46, 56 44"
            stroke={strokePrimary}
            strokeWidth="1.15"
            strokeLinecap="round"
            fill="none"
            opacity="0.72"
          />

          <circle
            className={sunClass}
            cx="32"
            cy="36"
            r="9.5"
            fill={`url(#${prefix}-sun)`}
            style={{ filter: `drop-shadow(0 0 6px ${glowCool})` }}
          />

          <path
            d="M6 44 H58"
            stroke={strokeSoft}
            strokeWidth="0.85"
            strokeLinecap="round"
            opacity="0.38"
          />
        </g>
      </svg>
    </div>
  )
}
