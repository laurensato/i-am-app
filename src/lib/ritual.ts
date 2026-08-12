import { type FactorType, type IdentityFactor } from '@/lib/types'
import type { BreathOrbPattern } from '@/lib/breathwork'
import { todayDateKey } from '@/lib/journalReading'

export type RitualStepId =
  | 'daily_message'
  | 'western_astrology'
  | 'eastern_astrology'
  | 'spirituality'
  | 'tarot_daily'
  | 'tarot_weekly'
  | 'values'
  | 'ikigai'
  | 'journal'
  | 'breathwork_grounding'
  | 'breathwork_calming'
  | 'breathwork_energy_boost'
  | 'breathwork_wellness'
  | 'breathwork_destress'
  | 'breathwork_peace'
  | 'visualization_worry_jar'
  | 'visualization_mindful_clouds'
  | 'visualization_confidence'
  | 'visualization_peace'

export type RitualStepKind = 'reading' | 'tool'

export type RitualStepIconKind = 'overview' | 'factor' | 'journal' | 'breathwork' | 'visualization'

export type RitualStepDefinition = {
  id: RitualStepId
  label: string
  shortLabel: string
  description: string
  href: string
  kind: RitualStepKind
  factor?: FactorType
  icon: RitualStepIconKind
  breathworkPattern?: BreathOrbPattern
}

export type RitualDragPayload = {
  stepId: RitualStepId
  source: 'carousel' | 'library'
}

export const RITUAL_DND_MIME = 'application/x-i-am-ritual-step'

const DEFAULT_RITUAL_ORDER: RitualStepId[] = [
  'daily_message',
  'western_astrology',
  'eastern_astrology',
  'spirituality',
  'tarot_daily',
  'tarot_weekly',
  'values',
  'ikigai',
]

/** Every step shown in the Add to your ritual grid, in display order. */
export const RITUAL_LIBRARY_ORDER: RitualStepId[] = [
  'daily_message',
  'western_astrology',
  'eastern_astrology',
  'spirituality',
  'tarot_daily',
  'tarot_weekly',
  'values',
  'ikigai',
  'journal',
  'breathwork_grounding',
  'breathwork_calming',
  'breathwork_energy_boost',
  'breathwork_wellness',
  'breathwork_destress',
  'breathwork_peace',
  'visualization_worry_jar',
  'visualization_mindful_clouds',
  'visualization_confidence',
  'visualization_peace',
]

const LEGACY_STEP_IDS = new Set(['breathwork', 'visualizations'])

const FACTOR_INSIGHT_DESCRIPTION: Record<Exclude<FactorType, 'tarot'>, string> = {
  western_astrology: 'Read how the sky speaks through your chart today.',
  eastern_astrology: "Sit with today's guidance for your sign.",
  spirituality: 'Receive a reading drawn from your spiritual path.',
  values: 'Reflect on how your values show up today.',
  ikigai: 'Reconnect with your reason for being today.',
}

const STEP_DEFINITIONS: Record<RitualStepId, Omit<RitualStepDefinition, 'id'>> = {
  daily_message: {
    label: "Today's Overview",
    shortLabel: 'Overview',
    description: 'Your daily insight and mantra on the dashboard.',
    href: '/dashboard',
    kind: 'reading',
    icon: 'overview',
  },
  western_astrology: {
    label: "Western Astrology — Today's Insight",
    shortLabel: 'Western',
    description: FACTOR_INSIGHT_DESCRIPTION.western_astrology,
    href: '/discover/western_astrology',
    kind: 'reading',
    factor: 'western_astrology',
    icon: 'factor',
  },
  eastern_astrology: {
    label: "Eastern Astrology — Today's Insight",
    shortLabel: 'Eastern',
    description: FACTOR_INSIGHT_DESCRIPTION.eastern_astrology,
    href: '/discover/eastern_astrology',
    kind: 'reading',
    factor: 'eastern_astrology',
    icon: 'factor',
  },
  spirituality: {
    label: "Spirituality — Today's Insight",
    shortLabel: 'Spirituality',
    description: FACTOR_INSIGHT_DESCRIPTION.spirituality,
    href: '/discover/spirituality',
    kind: 'reading',
    factor: 'spirituality',
    icon: 'factor',
  },
  tarot_daily: {
    label: 'Tarot — Daily Card',
    shortLabel: 'Tarot Daily',
    description: "Draw and read today's single-card message.",
    href: '/discover/tarot',
    kind: 'reading',
    factor: 'tarot',
    icon: 'factor',
  },
  tarot_weekly: {
    label: 'Tarot — Weekly Reading',
    shortLabel: 'Tarot Weekly',
    description: 'Reveal this week’s three-card spread and reading.',
    href: '/discover/tarot',
    kind: 'reading',
    factor: 'tarot',
    icon: 'factor',
  },
  values: {
    label: "Values — Today's Insight",
    shortLabel: 'Values',
    description: FACTOR_INSIGHT_DESCRIPTION.values,
    href: '/discover/values',
    kind: 'reading',
    factor: 'values',
    icon: 'factor',
  },
  ikigai: {
    label: "Ikigai — Today's Insight",
    shortLabel: 'Ikigai',
    description: FACTOR_INSIGHT_DESCRIPTION.ikigai,
    href: '/discover/ikigai',
    kind: 'reading',
    factor: 'ikigai',
    icon: 'factor',
  },
  journal: {
    label: 'Journal',
    shortLabel: 'Journal',
    description: 'Write what is on your mind today.',
    href: '/tools/journal',
    kind: 'tool',
    icon: 'journal',
  },
  breathwork_grounding: {
    label: 'Grounding Breath',
    shortLabel: 'Grounding',
    description: 'Square breathing to steady your nervous system.',
    href: '/tools/breathwork#grounding',
    kind: 'tool',
    icon: 'breathwork',
    breathworkPattern: 'square',
  },
  breathwork_calming: {
    label: 'Calming Breath',
    shortLabel: 'Calming',
    description: '4-7-8 breathing to soften stress and anxiety.',
    href: '/tools/breathwork#calming',
    kind: 'tool',
    icon: 'breathwork',
    breathworkPattern: 'fourSevenEight',
  },
  breathwork_energy_boost: {
    label: 'Energy Boost Breath',
    shortLabel: 'Energy Boost',
    description: 'Energizing breath to wake up body and mind.',
    href: '/tools/breathwork#energy-boost',
    kind: 'tool',
    icon: 'breathwork',
    breathworkPattern: 'sixTwo',
  },
  breathwork_wellness: {
    label: 'Wellness Breath',
    shortLabel: 'Wellness',
    description: 'Diaphragmatic breathing for deep relaxation.',
    href: '/tools/breathwork#wellness',
    kind: 'tool',
    icon: 'breathwork',
    breathworkPattern: 'wellness',
  },
  breathwork_destress: {
    label: 'De-stress Breath',
    shortLabel: 'De-stress',
    description: 'Alternate nostril breathing to restore balance.',
    href: '/tools/breathwork#destress',
    kind: 'tool',
    icon: 'breathwork',
    breathworkPattern: 'wellness',
  },
  breathwork_peace: {
    label: 'Peace Breath',
    shortLabel: 'Humming',
    description: 'Bhramari humming breath for inner quiet.',
    href: '/tools/breathwork#peace-breath',
    kind: 'tool',
    icon: 'breathwork',
    breathworkPattern: 'wellness',
  },
  visualization_worry_jar: {
    label: 'Worry Jar',
    shortLabel: 'Worry Jar',
    description: 'Contain a worry so you can set it aside for now.',
    href: '/tools/visualizations#worry-jar',
    kind: 'tool',
    icon: 'visualization',
  },
  visualization_mindful_clouds: {
    label: 'Mindful Clouds',
    shortLabel: 'Clouds',
    description: 'Watch thoughts drift by like clouds in the sky.',
    href: '/tools/visualizations#mindful-clouds',
    kind: 'tool',
    icon: 'visualization',
  },
  visualization_confidence: {
    label: 'Confidence',
    shortLabel: 'Confidence',
    description: 'Visualize yourself meeting a challenge with ease.',
    href: '/tools/visualizations#confidence',
    kind: 'tool',
    icon: 'visualization',
  },
  visualization_peace: {
    label: 'Peace Visualization',
    shortLabel: 'Peace Tide',
    description: 'Match your breath to the rhythm of the tide.',
    href: '/tools/visualizations#peace-tide',
    kind: 'tool',
    icon: 'visualization',
  },
}

export function getRitualStepDefinition(id: RitualStepId): RitualStepDefinition {
  return { id, ...STEP_DEFINITIONS[id] }
}

export function getAllRitualLibrarySteps(): RitualStepDefinition[] {
  return RITUAL_LIBRARY_ORDER.map(getRitualStepDefinition)
}

export function isFactorReadyForRitual(factor: IdentityFactor): boolean {
  if (!factor.is_active) return false
  if (factor.factor_type === 'tarot') return true
  return factor.discovery_completed
}

function isReadingStepEligible(id: RitualStepId, readyFactors: Set<FactorType>): boolean {
  if (id === 'daily_message') return true

  const definition = STEP_DEFINITIONS[id]
  if (definition.kind !== 'reading') return false
  if (id === 'tarot_daily' || id === 'tarot_weekly') return readyFactors.has('tarot')
  if (!definition.factor || definition.factor === 'tarot') return false
  return readyFactors.has(definition.factor)
}

export function isRitualStepEligible(id: RitualStepId, factors: IdentityFactor[]): boolean {
  if (!(id in STEP_DEFINITIONS)) return false
  const definition = STEP_DEFINITIONS[id]
  if (definition.kind === 'tool') return true

  const readyFactors = new Set(
    factors.filter(isFactorReadyForRitual).map(factor => factor.factor_type),
  )
  return isReadingStepEligible(id, readyFactors)
}

export function getEligibleRitualSteps(factors: IdentityFactor[]): RitualStepDefinition[] {
  return getAllRitualLibrarySteps().filter(step => isRitualStepEligible(step.id, factors))
}

export function getDefaultRitualStepIds(factors: IdentityFactor[]): RitualStepId[] {
  const eligible = new Set(getEligibleRitualSteps(factors).map(step => step.id))
  return DEFAULT_RITUAL_ORDER.filter(id => eligible.has(id))
}

export function resolveRitualSteps(
  stepIds: RitualStepId[],
  factors: IdentityFactor[],
): RitualStepDefinition[] {
  const eligible = new Map(getEligibleRitualSteps(factors).map(step => [step.id, step]))
  return stepIds
    .filter(id => !LEGACY_STEP_IDS.has(id))
    .map(id => eligible.get(id))
    .filter((step): step is RitualStepDefinition => !!step)
}

export function sanitizeRitualLayout(layout: RitualStepId[] | null): RitualStepId[] | null {
  if (!layout) return null
  const sanitized = layout.filter(
    id => !LEGACY_STEP_IDS.has(id) && id in STEP_DEFINITIONS,
  ) as RitualStepId[]
  return sanitized.length > 0 ? sanitized : null
}

export function normalizeRitualLayout(
  layout: RitualStepId[] | null,
  factors: IdentityFactor[],
): RitualStepId[] {
  const eligible = new Set(getEligibleRitualSteps(factors).map(step => step.id))
  const filtered = sanitizeRitualLayout(layout)?.filter(id => eligible.has(id)) ?? []
  if (filtered.length > 0) return filtered
  return getDefaultRitualStepIds(factors)
}

function ritualLayoutStorageKey(userId: string): string {
  return `ritual_layout:${userId}`
}

export function loadRitualLayout(userId: string): RitualStepId[] | null {
  try {
    const raw = localStorage.getItem(ritualLayoutStorageKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return sanitizeRitualLayout(parsed as RitualStepId[])
  } catch {
    return null
  }
}

export function saveRitualLayout(userId: string, stepIds: RitualStepId[]): void {
  try {
    localStorage.setItem(ritualLayoutStorageKey(userId), JSON.stringify(stepIds))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ritual-layout-changed', { detail: { userId } }))
    }
  } catch {
    // private browsing
  }
}

export const RITUAL_LAYOUT_CHANGED_EVENT = 'ritual-layout-changed'

export function isStepInRitualLayout(userId: string, stepId: RitualStepId): boolean {
  const layout = loadRitualLayout(userId)
  return layout?.includes(stepId) ?? false
}

export function getRitualStepIdForFactor(
  factor: FactorType,
  period: 'daily' | 'weekly' = 'daily',
): RitualStepId | null {
  if (factor === 'tarot') {
    return period === 'weekly' ? 'tarot_weekly' : 'tarot_daily'
  }
  if (factor in STEP_DEFINITIONS) return factor as RitualStepId
  return null
}

export type AddToRitualResult =
  | { ok: true }
  | { ok: false; reason: 'ineligible' | 'already_in_ritual' }

export function addStepToRitualLayout(
  userId: string,
  stepId: RitualStepId,
  factors: IdentityFactor[],
): AddToRitualResult {
  if (!isRitualStepEligible(stepId, factors)) {
    return { ok: false, reason: 'ineligible' }
  }

  const current = normalizeRitualLayout(loadRitualLayout(userId), factors)
  if (current.includes(stepId)) {
    return { ok: false, reason: 'already_in_ritual' }
  }

  const next = insertRitualStep(current, stepId, current.length)
  saveRitualLayout(userId, next)
  return { ok: true }
}

export function ritualProgressStorageKey(
  userId: string,
  stepId: RitualStepId,
  dateKey = todayDateKey(),
): string {
  return `ritual_progress:${userId}:${dateKey}:${stepId}`
}

export function loadRitualProgress(
  userId: string,
  stepIds: RitualStepId[],
  dateKey = todayDateKey(),
): Set<RitualStepId> {
  const completed = new Set<RitualStepId>()
  try {
    for (const stepId of stepIds) {
      if (localStorage.getItem(ritualProgressStorageKey(userId, stepId, dateKey)) === '1') {
        completed.add(stepId)
      }
    }
  } catch {
    // private browsing
  }
  return completed
}

export function setRitualStepComplete(
  userId: string,
  stepId: RitualStepId,
  complete: boolean,
  dateKey = todayDateKey(),
): void {
  const key = ritualProgressStorageKey(userId, stepId, dateKey)
  try {
    if (complete) localStorage.setItem(key, '1')
    else localStorage.removeItem(key)
  } catch {
    // private browsing
  }
}

export function readRitualDragPayload(dataTransfer: DataTransfer): RitualDragPayload | null {
  const raw = dataTransfer.getData(RITUAL_DND_MIME) || dataTransfer.getData('text/plain')
  if (!raw) return null
  try {
    return JSON.parse(raw) as RitualDragPayload
  } catch {
    return null
  }
}

export function writeRitualDragPayload(dataTransfer: DataTransfer, payload: RitualDragPayload): void {
  const json = JSON.stringify(payload)
  dataTransfer.setData(RITUAL_DND_MIME, json)
  dataTransfer.setData('text/plain', json)
  dataTransfer.effectAllowed = 'move'
}

export function insertRitualStep(
  stepIds: RitualStepId[],
  stepId: RitualStepId,
  targetIndex: number,
): RitualStepId[] {
  const fromIndex = stepIds.indexOf(stepId)
  const clampedTarget = Math.max(0, Math.min(targetIndex, stepIds.length))

  if (fromIndex === -1) {
    const next = [...stepIds]
    next.splice(clampedTarget, 0, stepId)
    return next
  }

  const next = stepIds.filter(id => id !== stepId)
  let insertAt = clampedTarget
  if (fromIndex < clampedTarget) insertAt -= 1
  insertAt = Math.max(0, Math.min(insertAt, next.length))
  next.splice(insertAt, 0, stepId)
  return next
}

export function removeRitualStep(stepIds: RitualStepId[], stepId: RitualStepId): RitualStepId[] {
  return stepIds.filter(id => id !== stepId)
}

/** @deprecated use resolveRitualSteps with layout ids */
export function buildDailyRitualSteps(factors: IdentityFactor[]): RitualStepDefinition[] {
  return resolveRitualSteps(getDefaultRitualStepIds(factors), factors)
}
