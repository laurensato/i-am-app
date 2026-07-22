'use client'

const VIEW = 500
const CENTER = 250
const OFFSET = 88
const RADIUS = 160

// Vertical band around the center pill that words must stay clear of (titles are exempt —
// overlapping the title text is fine, only the pill itself needs to stay legible).
const PILL_CLEAR_TOP = 205
const PILL_CLEAR_BOTTOM = 295

// Each circle is anchored from its own outer edge (left circles from the left, right circles
// from the right) so titles and words stay left/right-aligned within their own circle and never
// spill toward the opposite side.
const CIRCLES = [
  { key: 'love', lines: ['WHAT', 'YOU', 'LOVE'], color: 'var(--terracotta)', dx: -1, dy: -1, edge: 50, labelY: 20, wordsY: 20 },
  { key: 'good_at', lines: ['WHAT', "YOU'RE", 'GOOD', 'AT'], color: 'var(--sage)', dx: 1, dy: -1, edge: 50, labelY: 20, wordsY: 20 },
  { key: 'world_needs', lines: ['WHAT', 'THE', 'WORLD', 'NEEDS'], color: 'var(--forest)', dx: -1, dy: 1, edge: 50, labelY: 200, wordsY: PILL_CLEAR_BOTTOM + 20 },
  { key: 'paid_for', lines: ['WHAT', 'YOU', 'CAN', 'BE', 'PAID', 'FOR'], color: 'var(--warm-brown-light)', dx: 1, dy: 1, edge: 50, labelY: 200, wordsY: PILL_CLEAR_BOTTOM + 20 },
]

// Scatter offsets for up to 4 words, growing downward from each circle's own word-zone start —
// spread widely across the circle (free to overlap the title) but kept clear of the center pill band.
const WORD_SCATTER = [
  { inset: 10, y: 0, size: 15 },
  { inset: 95, y: 45, size: 15 },
  { inset: 30, y: 95, size: 15 },
  { inset: 105, y: 140, size: 15 },
]

// Older readings stored full phrases (e.g. "mentoring leaders and founders") rather than single
// words — reduce to the first word so the circles stay readable regardless of when data was generated.
function toSingleWords(phrases: string[] = []): string[] {
  const seen = new Set<string>()
  const words: string[] = []
  for (const phrase of phrases) {
    const word = phrase.trim().split(/\s+/)[0]?.replace(/[.,;:!?]+$/, '')
    if (!word || seen.has(word.toLowerCase())) continue
    seen.add(word.toLowerCase())
    words.push(word)
  }
  return words
}

interface IkigaiChartProps {
  word: string | null
  love?: string[]
  good_at?: string[]
  world_needs?: string[]
  paid_for?: string[]
  size?: number
  showWords?: boolean
}

export default function IkigaiChart({ word, love, good_at, world_needs, paid_for, size = 400, showWords = true }: IkigaiChartProps) {
  const words: Record<string, string[] | undefined> = { love, good_at, world_needs, paid_for }

  return (
    <div className="relative mx-auto" style={{ width: size, height: size, isolation: 'isolate' }}>
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} width={size} height={size}>
        {CIRCLES.map(c => (
          <circle key={c.key}
            cx={CENTER + c.dx * OFFSET} cy={CENTER + c.dy * OFFSET}
            r={RADIUS} fill={c.color} fillOpacity="0.5" style={{ mixBlendMode: 'multiply' }} />
        ))}
      </svg>

      {/* Big block-letter category labels, sitting behind the word lists */}
      {showWords && CIRCLES.map(c => (
        <div key={c.key} className="absolute" aria-hidden="true"
          style={{
            [c.dx === -1 ? 'left' : 'right']: `${(c.edge / VIEW) * 100}%`,
            top: `${(c.labelY / VIEW) * 100}%`,
            width: `${(190 / VIEW) * 100}%`,
            textAlign: c.dx === -1 ? 'left' : 'right',
          }}>
          {c.lines.map((line, i) => (
            <p key={i} className="font-black uppercase leading-[0.92]" style={{ color: c.color, opacity: 0.45, fontSize: 48 }}>
              {line}
            </p>
          ))}
        </div>
      ))}

      {/* Their own words, scattered organically on top — free to overlap the title, but clear of the pill */}
      {showWords && CIRCLES.map(c => {
        const list = toSingleWords(words[c.key]).slice(0, 4)
        return list.map((w, i) => {
          const slot = WORD_SCATTER[i]
          const y = Math.min(c.wordsY + slot.y, c.dy === -1 ? PILL_CLEAR_TOP - 20 : VIEW - 25)
          return (
            <p key={w} className="absolute font-semibold whitespace-nowrap"
              style={{
                [c.dx === -1 ? 'left' : 'right']: `${((c.edge + slot.inset) / VIEW) * 100}%`,
                top: `${(y / VIEW) * 100}%`,
                fontSize: slot.size,
                color: 'white',
              }}>
              {w}
            </p>
          )
        })
      })}

      <div className="absolute inset-0 flex items-center justify-center">
        {word ? (
          <span className="px-4 py-2 rounded-full font-semibold text-center"
            style={{
              backgroundColor: 'var(--warm-white)', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.18)', fontSize: showWords ? 18 : 12,
            }}>
            {word}
          </span>
        ) : (
          <div className="h-3 w-16 rounded-full animate-pulse" style={{ backgroundColor: 'var(--warm-white)' }} />
        )}
      </div>
    </div>
  )
}
