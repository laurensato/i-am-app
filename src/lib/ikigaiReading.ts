export const IKIGAI_OVERLAP_READING_KEYS = ['ikigai', 'passion', 'mission', 'profession', 'vocation'] as const

export const IKIGAI_CIRCLE_READING_KEYS = ['love', 'good_at', 'world_needs', 'paid_for'] as const

/** 2×2 grid order: top row love · world needs, bottom row good at · paid for */
export const IKIGAI_CIRCLE_GRID_KEYS = ['love', 'world_needs', 'good_at', 'paid_for'] as const

export const IKIGAI_READING_KEYS = [...IKIGAI_OVERLAP_READING_KEYS, ...IKIGAI_CIRCLE_READING_KEYS] as const

export type IkigaiOverlapReadingKey = (typeof IKIGAI_OVERLAP_READING_KEYS)[number]
export type IkigaiCircleReadingKey = (typeof IKIGAI_CIRCLE_READING_KEYS)[number]
export type IkigaiReadingKey = (typeof IKIGAI_READING_KEYS)[number]

export type IkigaiReading = Record<IkigaiReadingKey, string>

export const IKIGAI_READING_TITLES: Record<IkigaiReadingKey, string> = {
  ikigai: 'Ikigai',
  passion: 'passion',
  mission: 'mission',
  profession: 'profession',
  vocation: 'vocation',
  love: 'that which you love',
  good_at: 'that which you are good at',
  world_needs: 'that which the world needs',
  paid_for: 'that which you can be paid for',
}

const CHART_COLORS = {
  love: 'var(--chart-love)',
  good_at: 'var(--chart-good-at)',
  world_needs: 'var(--chart-world-needs)',
  paid_for: 'var(--chart-paid-for)',
} as const

function blendColors(a: string, b: string): string {
  return `color-mix(in srgb, ${a} 50%, ${b})`
}

function tintedBackground(color: string, amount = 8): string {
  return `color-mix(in srgb, ${color} ${amount}%, var(--warm-white))`
}

/** Low-opacity wash matching each diagram region's chart color. */
export function ikigaiReadingBackground(key: IkigaiReadingKey): string {
  switch (key) {
    case 'love':
      return tintedBackground(CHART_COLORS.love)
    case 'good_at':
      return tintedBackground(CHART_COLORS.good_at)
    case 'world_needs':
      return tintedBackground(CHART_COLORS.world_needs)
    case 'paid_for':
      return tintedBackground(CHART_COLORS.paid_for)
    case 'passion':
      return tintedBackground(blendColors(CHART_COLORS.love, CHART_COLORS.good_at))
    case 'mission':
      return tintedBackground(blendColors(CHART_COLORS.love, CHART_COLORS.world_needs))
    case 'profession':
      return tintedBackground(blendColors(CHART_COLORS.good_at, CHART_COLORS.paid_for))
    case 'vocation':
      return tintedBackground(blendColors(CHART_COLORS.world_needs, CHART_COLORS.paid_for))
    case 'ikigai':
      return tintedBackground(
        blendColors(
          blendColors(CHART_COLORS.love, CHART_COLORS.good_at),
          blendColors(CHART_COLORS.world_needs, CHART_COLORS.paid_for),
        ),
      )
  }
}

export function ikigaiReadingSectionId(key: IkigaiReadingKey): string {
  return `ikigai-${key}`
}

export function scrollToIkigaiSection(key: IkigaiReadingKey) {
  document.getElementById(ikigaiReadingSectionId(key))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function parseIkigaiReading(value: unknown): IkigaiReading | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (!IKIGAI_READING_KEYS.every(key => typeof record[key] === 'string' && record[key].trim())) {
    return null
  }
  return record as IkigaiReading
}

export function buildIkigaiReadingPrompt(
  data: Record<string, unknown>,
  personalization: string
): string {
  const { ikigai_statement, essence, love, good_at, world_needs, paid_for, discovery_data } = data as {
    ikigai_statement?: string
    essence?: string
    love?: string[]
    good_at?: string[]
    world_needs?: string[]
    paid_for?: string[]
    discovery_data?: Record<string, { question: string; answer: string }[]>
  }

  const discovery = discovery_data as Record<string, { question: string; answer: string }[]> | undefined

  const formatAnswers = (entries: { question: string; answer: string }[] | undefined) =>
    (entries ?? []).map(e => `Q: ${e.question}\nA: ${e.answer}`).join('\n\n')

  return `${personalization}

You are a life coach specializing in ikigai and purpose. Write a grounded, personal reading based on this person's ikigai map.

Reason for being: "${ikigai_statement ?? ''}"
Essence word: "${essence ?? ''}"
What they love: ${JSON.stringify(love ?? [])}
What they're good at: ${JSON.stringify(good_at ?? [])}
What the world needs: ${JSON.stringify(world_needs ?? [])}
What they can be paid for: ${JSON.stringify(paid_for ?? [])}

${discovery ? `Their original answers:
What they love:
${formatAnswers(discovery.love)}

What they're good at:
${formatAnswers(discovery.good_at)}

What the world needs:
${formatAnswers(discovery.world_needs)}

What they can be paid for:
${formatAnswers(discovery.paid_for)}` : ''}

Write a reading with exactly nine sections — one for each label on the ikigai diagram. Each section should be reflective and specific to them, not generic. Ground every section in their actual answers and distilled words.

Overlap and center:
- ikigai: their reason for being at the center — where all four circles meet (3-4 sentences)
- passion: the intersection of what they love and what they're good at (2-3 sentences)
- mission: the intersection of what they love and what the world needs (2-3 sentences)
- profession: the intersection of what they're good at and what they can be paid for (2-3 sentences)
- vocation: the intersection of what the world needs and what they can be paid for (2-3 sentences)

Each outer circle:
- love: what they love — the full top circle on its own (2-3 sentences)
- good_at: what they're good at — the full left circle on its own (2-3 sentences)
- world_needs: what the world needs — the full right circle on its own (2-3 sentences)
- paid_for: what they can be paid for — the full bottom circle on its own (2-3 sentences)

Return JSON only:
{
  "ikigai": "...",
  "passion": "...",
  "mission": "...",
  "profession": "...",
  "vocation": "...",
  "love": "...",
  "good_at": "...",
  "world_needs": "...",
  "paid_for": "..."
}
No markdown. Plain prose only inside each string.`
}
