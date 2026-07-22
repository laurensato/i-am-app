'use client'
import { NatalChart as NatalChartData } from '@/lib/natalChart'

// Text abbreviations rather than Unicode zodiac glyphs (♈-♓) — those codepoints render as
// inconsistent colored emoji-style badges on Apple platforms instead of plain glyphs.
const ZODIAC_SIGNS = [
  { sign: 'Aries', abbr: 'ARI' }, { sign: 'Taurus', abbr: 'TAU' }, { sign: 'Gemini', abbr: 'GEM' },
  { sign: 'Cancer', abbr: 'CAN' }, { sign: 'Leo', abbr: 'LEO' }, { sign: 'Virgo', abbr: 'VIR' },
  { sign: 'Libra', abbr: 'LIB' }, { sign: 'Scorpio', abbr: 'SCO' }, { sign: 'Sagittarius', abbr: 'SAG' },
  { sign: 'Capricorn', abbr: 'CAP' }, { sign: 'Aquarius', abbr: 'AQU' }, { sign: 'Pisces', abbr: 'PSC' },
]

const PLANET_SYMBOLS: Record<string, string> = {
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂',
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
}

const ASPECT_STYLE: Record<string, { color: string; width: number }> = {
  conjunction: { color: 'var(--gold)', width: 1 },
  opposition: { color: 'var(--forest)', width: 1.25 },
  square: { color: 'var(--forest)', width: 1 },
  trine: { color: 'var(--sage)', width: 1.25 },
  sextile: { color: 'var(--sage-light)', width: 1 },
}

const CENTER = 170
const R_ZODIAC_OUTER = 165
const R_ZODIAC_INNER = 138
const R_HOUSE_OUTER = 138
const R_HOUSE_INNER = 108
const R_PLANET = 92
const R_ASPECT = 62

function pointOn(degree: number, ascendantDegree: number, radius: number) {
  const wheelAngle = ((degree - ascendantDegree) % 360 + 360) % 360
  const mathAngleRad = ((180 + wheelAngle) * Math.PI) / 180
  return {
    x: CENTER + radius * Math.cos(mathAngleRad),
    y: CENTER - radius * Math.sin(mathAngleRad),
  }
}

export default function NatalChartWheel({ chart }: { chart: NatalChartData }) {
  const asc = chart.ascendant.degree

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 340 340" width="100%" style={{ maxWidth: 340 }}>
        {/* Zodiac ring */}
        <circle cx={CENTER} cy={CENTER} r={R_ZODIAC_OUTER} fill="var(--warm-white)" stroke="var(--parchment)" />
        <circle cx={CENTER} cy={CENTER} r={R_ZODIAC_INNER} fill="none" stroke="var(--parchment)" />
        {ZODIAC_SIGNS.map((z, i) => {
          const startDeg = i * 30
          const start = pointOn(startDeg, asc, R_ZODIAC_OUTER)
          const startInner = pointOn(startDeg, asc, R_ZODIAC_INNER)
          const mid = pointOn(startDeg + 15, asc, (R_ZODIAC_OUTER + R_ZODIAC_INNER) / 2)
          return (
            <g key={z.sign}>
              <line x1={startInner.x} y1={startInner.y} x2={start.x} y2={start.y} stroke="var(--parchment)" />
              <text x={mid.x} y={mid.y} textAnchor="middle" dominantBaseline="central"
                fontSize="8" letterSpacing="0.5" fill="var(--text-secondary)">{z.abbr}</text>
            </g>
          )
        })}

        {/* House ring */}
        <circle cx={CENTER} cy={CENTER} r={R_HOUSE_INNER} fill="none" stroke="var(--parchment)" />
        {chart.houses.map(h => {
          const outer = pointOn(h.degree, asc, R_HOUSE_OUTER)
          const inner = pointOn(h.degree, asc, R_HOUSE_INNER)
          const nextDeg = chart.houses[h.id % 12].degree
          const labelDeg = h.degree + (((nextDeg - h.degree) % 360 + 360) % 360) / 2
          const label = pointOn(labelDeg, asc, R_HOUSE_INNER - 12)
          const major = h.id === 1 || h.id === 4 || h.id === 7 || h.id === 10
          return (
            <g key={h.id}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                stroke={major ? 'var(--text-muted)' : 'var(--parchment)'} strokeWidth={major ? 1.5 : 1} />
              <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="central"
                fontSize="9" fill="var(--text-muted)">{h.id}</text>
            </g>
          )
        })}

        {/* Aspect lines */}
        <circle cx={CENTER} cy={CENTER} r={R_ASPECT} fill="none" stroke="var(--parchment)" strokeDasharray="2 3" />
        {chart.aspects.map((a, i) => {
          const p1 = chart.planets.find(p => p.key === a.point1)
          const p2 = chart.planets.find(p => p.key === a.point2)
          if (!p1 || !p2) return null
          const from = pointOn(p1.degree, asc, R_ASPECT)
          const to = pointOn(p2.degree, asc, R_ASPECT)
          const style = ASPECT_STYLE[a.type] ?? { color: 'var(--text-muted)', width: 1 }
          return (
            <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={style.color} strokeWidth={style.width} opacity={0.65} />
          )
        })}

        {/* Planets */}
        {chart.planets.map(p => {
          const pos = pointOn(p.degree, asc, R_PLANET)
          return (
            <g key={p.key}>
              <circle cx={pos.x} cy={pos.y} r={10} fill="var(--warm-white)" stroke="var(--parchment)" />
              <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                fontSize="11" fill="var(--text-primary)">{PLANET_SYMBOLS[p.key]}</text>
            </g>
          )
        })}

        {/* Ascendant / Midheaven markers */}
        {(() => {
          const ascPt = pointOn(chart.ascendant.degree, asc, R_ZODIAC_OUTER)
          const ascLabel = pointOn(chart.ascendant.degree, asc, R_ZODIAC_OUTER + 12)
          const mcPt = pointOn(chart.midheaven.degree, asc, R_ZODIAC_OUTER)
          const mcLabel = pointOn(chart.midheaven.degree, asc, R_ZODIAC_OUTER + 12)
          return (
            <>
              <line x1={CENTER} y1={CENTER} x2={ascPt.x} y2={ascPt.y} stroke="var(--gold)" strokeWidth={1.5} />
              <text x={ascLabel.x} y={ascLabel.y} textAnchor="middle" dominantBaseline="central"
                fontSize="9" fontWeight="600" fill="var(--gold)">ASC</text>
              <line x1={CENTER} y1={CENTER} x2={mcPt.x} y2={mcPt.y} stroke="var(--forest)" strokeWidth={1.5} />
              <text x={mcLabel.x} y={mcLabel.y} textAnchor="middle" dominantBaseline="central"
                fontSize="9" fontWeight="600" fill="var(--forest)">MC</text>
            </>
          )
        })()}
      </svg>
      {chart.timeUnknown && (
        <p className="text-xs font-light mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
          Birth time wasn&apos;t provided — houses, Ascendant, and Moon degree are approximate.
        </p>
      )}
    </div>
  )
}

const ASPECT_LABELS: Record<string, string> = {
  conjunction: 'Conjunction', opposition: 'Opposition', square: 'Square', trine: 'Trine', sextile: 'Sextile',
}

export function AspectsTable({ chart }: { chart: NatalChartData }) {
  const labelFor = (key: string) => chart.planets.find(p => p.key === key)?.label ?? key

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--parchment)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: 'var(--parchment)' }}>
            <th className="text-left font-medium px-3 py-2" style={{ color: 'var(--text-secondary)' }}>Planet</th>
            <th className="text-left font-medium px-3 py-2" style={{ color: 'var(--text-secondary)' }}>Aspect</th>
            <th className="text-left font-medium px-3 py-2" style={{ color: 'var(--text-secondary)' }}>Planet</th>
            <th className="text-right font-medium px-3 py-2" style={{ color: 'var(--text-secondary)' }}>Orb</th>
          </tr>
        </thead>
        <tbody>
          {chart.aspects.map((a, i) => {
            const style = ASPECT_STYLE[a.type] ?? { color: 'var(--text-muted)', width: 1 }
            return (
              <tr key={i} style={{ borderTop: '1px solid var(--parchment)' }}>
                <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                  {PLANET_SYMBOLS[a.point1]} {labelFor(a.point1)}
                </td>
                <td className="px-3 py-2" style={{ color: style.color }}>
                  {ASPECT_LABELS[a.type] ?? a.type}
                </td>
                <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                  {PLANET_SYMBOLS[a.point2]} {labelFor(a.point2)}
                </td>
                <td className="px-3 py-2 text-right font-light" style={{ color: 'var(--text-muted)' }}>
                  {a.orb.toFixed(1)}°
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
