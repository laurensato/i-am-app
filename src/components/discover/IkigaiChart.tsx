'use client'

import { Caveat } from 'next/font/google'
import type { IkigaiReadingKey } from '@/lib/ikigaiReading'
import { ikigaiReadingSectionId, scrollToIkigaiSection } from '@/lib/ikigaiReading'

const ikigaiScript = Caveat({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
})

const VIEW = 400
const CENTER = 200
const RADIUS = 118
const OFFSET = 82
/** Inset so circle strokes aren't clipped at the viewBox edge. */
const PADDING = 20

const LINE_HEIGHT = 30

const LABEL_FONT = ikigaiScript.style.fontFamily

/** Classic ikigai layout: top, right, bottom, left — all overlapping at center. */
const CIRCLES = [
  { key: 'love', cx: CENTER, cy: CENTER - OFFSET, color: 'var(--chart-love)', splashCx: CENTER, splashCy: 54 },
  { key: 'world-needs', cx: CENTER + OFFSET, cy: CENTER, color: 'var(--chart-world-needs)', splashCx: 346, splashCy: CENTER },
  { key: 'paid-for', cx: CENTER, cy: CENTER + OFFSET, color: 'var(--chart-paid-for)', splashCx: CENTER, splashCy: 346 },
  { key: 'good-at', cx: CENTER - OFFSET, cy: CENTER, color: 'var(--chart-good-at)', splashCx: 54, splashCy: CENTER },
] as const

/** Outer circle labels — positioned in the outer arc of each circle. */
const CIRCLE_LABELS = [
  { lines: ['that which', 'you love'], sectionKey: 'love' as const, x: CENTER, y: 44, anchor: 'middle' as const },
  { lines: ['that which', 'the world', 'needs'], sectionKey: 'world_needs' as const, x: 356, y: CENTER, anchor: 'middle' as const },
  { lines: ['that which you', 'can be paid for'], sectionKey: 'paid_for' as const, x: CENTER, y: 362, anchor: 'middle' as const },
  { lines: ['that which you', 'are good at'], sectionKey: 'good_at' as const, x: 44, y: CENTER, anchor: 'middle' as const },
]

/** Two-circle overlap labels — pushed toward the outer edge of each lens. */
const OVERLAP_LABELS = [
  { text: 'passion', sectionKey: 'passion' as const, x: 128, y: 142 },
  { text: 'mission', sectionKey: 'mission' as const, x: 272, y: 142 },
  { text: 'profession', sectionKey: 'profession' as const, x: 128, y: 278 },
  { text: 'vocation', sectionKey: 'vocation' as const, x: 272, y: 278 },
]

const CENTER_LABEL = { text: 'ikigai', sectionKey: 'ikigai' as const, x: CENTER, y: 206 }

interface IkigaiChartProps {
  size?: number
  /** When true, diagram labels link to reading cards below. */
  linkToReading?: boolean
}

function MultilineLabel({
  lines,
  x,
  y,
  anchor,
  size,
  sectionKey,
  linkToReading,
}: {
  lines: string[]
  x: number
  y: number
  anchor: 'middle' | 'start' | 'end'
  size: number
  sectionKey?: IkigaiReadingKey
  linkToReading?: boolean
}) {
  const startY = y - ((lines.length - 1) * LINE_HEIGHT) / 2

  const textEl = (
    <text
      x={x}
      y={startY}
      textAnchor={anchor}
      fill="var(--sol-navy)"
      fontSize={size}
      style={{ fontFamily: LABEL_FONT }}
      className={linkToReading && sectionKey ? 'transition-opacity hover:opacity-60' : undefined}
    >
      {lines.map((line, i) => (
        <tspan key={line} x={x} dy={i === 0 ? 0 : LINE_HEIGHT}>
          {line}
        </tspan>
      ))}
    </text>
  )

  if (!linkToReading || !sectionKey) return textEl

  return (
    <a
      href={`#${ikigaiReadingSectionId(sectionKey)}`}
      onClick={e => {
        e.preventDefault()
        scrollToIkigaiSection(sectionKey)
      }}
      style={{ cursor: 'pointer' }}
      aria-label={`Jump to ${lines.join(' ')} reading`}
    >
      {textEl}
    </a>
  )
}

function ReadingLinkLabel({
  sectionKey,
  x,
  y,
  children,
  fontSize,
  fontWeight,
  linkToReading,
  dominantBaseline,
}: {
  sectionKey: IkigaiReadingKey
  x: number
  y: number
  children: string
  fontSize: number
  fontWeight?: number
  linkToReading: boolean
  dominantBaseline?: 'middle' | 'auto' | 'inherit' | 'alphabetic' | 'hanging' | 'ideographic' | 'mathematical' | 'use-script' | 'no-change' | 'reset-size' | 'central' | 'text-after-edge' | 'text-before-edge'
}) {
  const textProps = {
    x,
    y,
    textAnchor: 'middle' as const,
    dominantBaseline,
    fill: 'var(--sol-navy)',
    fontSize,
    style: { fontFamily: LABEL_FONT, fontWeight },
  }

  if (!linkToReading) {
    return <text {...textProps}>{children}</text>
  }

  const sectionId = ikigaiReadingSectionId(sectionKey)

  return (
    <a
      href={`#${sectionId}`}
      onClick={e => {
        e.preventDefault()
        scrollToIkigaiSection(sectionKey)
      }}
      style={{ cursor: 'pointer' }}
      aria-label={`Jump to ${children} reading`}
    >
      <text
        {...textProps}
        className="transition-opacity hover:opacity-60"
      >
        {children}
      </text>
    </a>
  )
}

export default function IkigaiChart({ size = 320, linkToReading = false }: IkigaiChartProps) {
  const viewMin = -PADDING
  const viewSize = VIEW + PADDING * 2
  const showLabels = size >= 200
  const outerFontSize = 28
  const overlapFontSize = 26
  const centerFontSize = 32

  return (
    <div className={`relative mx-auto ${ikigaiScript.className}`} style={{ width: size, height: size }}>
      <svg
        viewBox={`${viewMin} ${viewMin} ${viewSize} ${viewSize}`}
        width={size}
        height={size}
        role="img"
        aria-label="Ikigai diagram"
        overflow="visible"
      >
        <defs>
          {CIRCLES.map(c => (
            <radialGradient
              key={c.key}
              id={`ikigai-splash-${c.key}`}
              gradientUnits="userSpaceOnUse"
              cx={c.splashCx}
              cy={c.splashCy}
              r={128}
            >
              <stop offset="0%" stopColor={c.color} stopOpacity={0.62} />
              <stop offset="40%" stopColor={c.color} stopOpacity={0.38} />
              <stop offset="100%" stopColor={c.color} stopOpacity={0} />
            </radialGradient>
          ))}
          <filter id="ikigai-watercolor" x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Soft watercolor washes — multiply so overlaps deepen like paint */}
        <g filter="url(#ikigai-watercolor)" style={{ mixBlendMode: 'multiply' }}>
          {CIRCLES.map(c => (
            <g key={`wash-${c.key}`}>
              <circle
                cx={c.cx}
                cy={c.cy}
                r={RADIUS}
                fill={`url(#ikigai-splash-${c.key})`}
              />
              <ellipse
                cx={c.splashCx}
                cy={c.splashCy}
                rx={72}
                ry={88}
                fill={c.color}
                opacity={0.22}
                transform={`rotate(${c.key === 'love' ? -8 : c.key === 'paid-for' ? 6 : c.key === 'good-at' ? -4 : 5}, ${c.splashCx}, ${c.splashCy})`}
              />
            </g>
          ))}
        </g>

        {CIRCLES.map(c => (
          <circle
            key={`stroke-${c.key}`}
            cx={c.cx}
            cy={c.cy}
            r={RADIUS}
            fill="none"
            stroke="var(--sol-navy)"
            strokeWidth={1.5}
          />
        ))}

        {showLabels && (
          <>
            {CIRCLE_LABELS.map(label => (
              <MultilineLabel
                key={label.lines.join('-')}
                lines={label.lines}
                x={label.x}
                y={label.y}
                anchor={label.anchor}
                size={outerFontSize}
                sectionKey={label.sectionKey}
                linkToReading={linkToReading}
              />
            ))}

            {OVERLAP_LABELS.map(label => (
              <ReadingLinkLabel
                key={label.text}
                sectionKey={label.sectionKey}
                x={label.x}
                y={label.y}
                fontSize={overlapFontSize}
                linkToReading={linkToReading}
              >
                {label.text}
              </ReadingLinkLabel>
            ))}

            <ReadingLinkLabel
              sectionKey={CENTER_LABEL.sectionKey}
              x={CENTER_LABEL.x}
              y={CENTER_LABEL.y}
              fontSize={centerFontSize}
              fontWeight={500}
              linkToReading={linkToReading}
              dominantBaseline="middle"
            >
              {CENTER_LABEL.text}
            </ReadingLinkLabel>
          </>
        )}
      </svg>
    </div>
  )
}
