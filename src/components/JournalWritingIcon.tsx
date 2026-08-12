'use client'

import { useId } from 'react'

type Props = {
  size?: number
  animated?: boolean
  variant?: 'default' | 'onDark'
}

export default function JournalWritingIcon({
  size = 64,
  animated = true,
  variant = 'default',
}: Props) {
  const id = useId().replace(/:/g, '')
  const onDark = variant === 'onDark'
  const prefix = `journal-bulb-${id}`

  const strokePrimary = onDark ? 'rgba(255,255,255,0.72)' : 'rgba(150,185,220,0.78)'
  const strokeMid = onDark ? 'rgba(210,228,248,0.42)' : 'rgba(175,200,235,0.52)'
  const strokeSoft = onDark ? 'rgba(190,215,240,0.24)' : 'rgba(190,210,235,0.32)'
  const fillGlass = onDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.18)'
  const fillWarm = onDark ? 'rgba(255, 228, 170, 0.42)' : 'rgba(255, 236, 190, 0.55)'
  const glowWarm = onDark ? 'rgba(255, 214, 140, 0.32)' : 'rgba(255, 210, 130, 0.4)'
  const glowCool = onDark ? 'rgba(220,235,255,0.35)' : 'rgba(160,190,225,0.45)'

  const groupClass = animated ? 'journal-bulb-group' : undefined
  const glowClass = animated ? 'journal-bulb-glow' : undefined
  const innerClass = animated ? 'journal-bulb-inner' : undefined
  const filamentClass = animated ? 'journal-bulb-filament' : undefined
  const shellMidClass = animated ? 'journal-bulb-shell-mid' : undefined
  const shellClass = animated ? 'journal-bulb-shell' : undefined

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
        className={glowClass}
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
          <radialGradient id={`${prefix}-inner`} cx="50%" cy="40%" r="52%">
            <stop offset="0%" stopColor={fillWarm} stopOpacity="0.95" />
            <stop offset="50%" stopColor={fillWarm} stopOpacity="0.35" />
            <stop offset="100%" stopColor={fillWarm} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${prefix}-shell`} x1="32" y1="10" x2="32" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={strokeSoft} stopOpacity="0.2" />
            <stop offset="35%" stopColor={strokePrimary} stopOpacity="0.85" />
            <stop offset="65%" stopColor={strokeMid} stopOpacity="0.7" />
            <stop offset="100%" stopColor={strokeSoft} stopOpacity="0.15" />
          </linearGradient>
          <filter id={`${prefix}-blur`} x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter={`url(#${prefix}-blur)`} className={groupClass}>
          <ellipse
            className={innerClass}
            cx="32"
            cy="26"
            rx="12.5"
            ry="14.5"
            fill={`url(#${prefix}-inner)`}
          />

          <path
            className={shellMidClass}
            d="M32 11.5C24.5 11.5 18.5 18.5 18.5 27C18.5 34.2 22.2 40 27.5 42.5V46.5H36.5V42.5C41.8 40 45.5 34.2 45.5 27C45.5 18.5 39.5 11.5 32 11.5Z"
            fill={fillGlass}
            stroke={strokeMid}
            strokeWidth="3"
            strokeLinejoin="round"
            opacity="0.28"
          />

          <path
            className={shellClass}
            d="M32 11.5C24.5 11.5 18.5 18.5 18.5 27C18.5 34.2 22.2 40 27.5 42.5V46.5H36.5V42.5C41.8 40 45.5 34.2 45.5 27C45.5 18.5 39.5 11.5 32 11.5Z"
            fill={fillGlass}
            stroke={`url(#${prefix}-shell)`}
            strokeWidth="1.15"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 5px ${glowCool})` }}
          />

          <path
            className={filamentClass}
            d="M32 22V30M28.5 25.5Q32 29 35.5 25.5"
            stroke={strokeMid}
            strokeWidth="0.85"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.72"
          />

          <path
            className={shellClass}
            d="M26.5 47.2H37.5C38.1 47.2 38.5 47.6 38.5 48.2V50.2C38.5 52 37.2 53.5 35.4 53.5H28.6C26.8 53.5 25.5 52 25.5 50.2V48.2C25.5 47.6 25.9 47.2 26.5 47.2Z"
            fill={strokeSoft}
            fillOpacity="0.35"
            stroke="none"
          />
        </g>
      </svg>
    </div>
  )
}
