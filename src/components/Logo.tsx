interface LogoProps {
  size?: number
  color?: string
  variant?: 'auto' | 'lines' | 'solid' | 'dot'
}

// Moon over ripples — the "I AM" mark. Fine concentric arcs only read cleanly at large
// display sizes; below that, thin curved strokes get crammed into very few pixels and look
// grainy no matter how few arcs there are (this is inherent to anti-aliasing curves at small
// sizes, not a rasterization bug). So below the 60px "lines" threshold, 'auto' drops all the
// way to a plain filled dot — a solid shape stays crisp at any size — rather than the
// intermediate 2-arc 'solid' variant, which still showed the same graininess in practice.
// 'solid' remains available to call explicitly if a specific spot wants the ringed look.
export default function Logo({ size = 40, color = 'currentColor', variant = 'auto' }: LogoProps) {
  const resolved = variant === 'auto' ? (size >= 60 ? 'lines' : 'dot') : variant

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      {resolved === 'dot' ? (
        <circle cx={60} cy={40} r={18} fill={color} />
      ) : resolved === 'solid' ? (
        <g transform="translate(0,10)">
          <circle cx={60} cy={30} r={15} fill={color} />
          <g fill="none" stroke={color} strokeWidth={9}>
            <path d="M 30 36 A 30 30 0 0 0 90 36" />
            <path d="M 16 36 A 44 44 0 0 0 104 36" />
          </g>
        </g>
      ) : (
        <g transform="translate(0,15)">
          <circle cx={60} cy={18} r={14} fill={color} />
          <g fill="none" stroke={color} strokeWidth={4.2}>
            <path d="M 38 32 A 22 22 0 0 0 82 32" />
            <path d="M 30 32 A 30 30 0 0 0 90 32" />
            <path d="M 22 32 A 38 38 0 0 0 98 32" />
            <path d="M 14 32 A 46 46 0 0 0 106 32" />
            <path d="M 6 32 A 54 54 0 0 0 114 32" />
          </g>
        </g>
      )}
    </svg>
  )
}
