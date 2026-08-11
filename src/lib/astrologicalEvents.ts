import {
  ChartPlanet,
  computeTransitingPlanets,
} from '@/lib/natalChart'
import {
  addLocalDays,
  dateKeyToNoonUtc,
  enumerateLocalDayKeys,
  formatRelativeDay,
  localDateKey,
} from '@/lib/localDate'
import type { WesternAstrologyEvent } from '@/lib/structuredReading'

export interface DetectedAstrologicalEvent {
  date: string
  title: string
  detail: string
  weight: number
}

const SKY_BODY_KEYS = ['sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']
const OUTER_KEYS = new Set(['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'])

function angleDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360
  return diff > 180 ? 360 - diff : diff
}

function toJulianDay(date: Date): number {
  return date.getTime() / 86_400_000 + 2440587.5
}

/** Approximate mean lunar node longitude (degrees) for eclipse detection. */
function meanLunarNodeLongitude(date: Date): number {
  const T = (toJulianDay(date) - 2451545.0) / 36525.0
  const omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T ** 3) / 450_000
  return ((omega % 360) + 360) % 360
}

function moonNearNode(moonDegree: number, nodeDegree: number, orb: number): boolean {
  const distNode = angleDiff(moonDegree, nodeDegree)
  const distOpposite = angleDiff(moonDegree, (nodeDegree + 180) % 360)
  return distNode <= orb || distOpposite <= orb
}

function dedupeEvents(events: DetectedAstrologicalEvent[]): DetectedAstrologicalEvent[] {
  const seen = new Set<string>()
  return events.filter(event => {
    const key = `${event.date}:${event.title}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Same sky event persisting across days → keep the earliest date (and highest weight if tied). */
function eventDedupeKey(event: DetectedAstrologicalEvent): string {
  const title = event.title.toLowerCase()
  const alignmentMatch = title.match(/(?:major )?planetary alignment in (\w+)/)
  if (alignmentMatch) return `alignment:${alignmentMatch[1]}`

  const conjunctMatch = title.match(/^(.+) conjunct (.+)$/)
  if (conjunctMatch) {
    const pair = [conjunctMatch[1].trim(), conjunctMatch[2].trim()].sort().join('|')
    return `conjunct:${pair}`
  }

  return title
}

function dedupePersistentEvents(events: DetectedAstrologicalEvent[]): DetectedAstrologicalEvent[] {
  const best = new Map<string, DetectedAstrologicalEvent>()

  for (const event of events) {
    const key = eventDedupeKey(event)
    const existing = best.get(key)
    if (
      !existing ||
      event.date < existing.date ||
      (event.date === existing.date && event.weight > existing.weight)
    ) {
      best.set(key, event)
    }
  }

  return [...best.values()]
}

function detectEclipseAndMoonEvents(dayKeys: string[]): DetectedAstrologicalEvent[] {
  const events: DetectedAstrologicalEvent[] = []
  let bestNew = { date: '', orb: Infinity, sign: '' }
  let bestFull = { date: '', orb: Infinity, sign: '' }

  for (const dayKey of dayKeys) {
    const date = dateKeyToNoonUtc(dayKey)
    const planets = computeTransitingPlanets(date)
    const sun = planets.find(p => p.key === 'sun')
    const moon = planets.find(p => p.key === 'moon')
    if (!sun || !moon) continue

    const separation = angleDiff(sun.degree, moon.degree)
    const newOrb = separation
    const fullOrb = Math.abs(separation - 180)
    const node = meanLunarNodeLongitude(date)

    if (newOrb <= 5 && moonNearNode(moon.degree, node, 12)) {
      events.push({
        date: dayKey,
        title: `Solar Eclipse in ${moon.sign}`,
        detail: 'A rare new moon near the lunar nodes — a potent reset point in the sky.',
        weight: 12,
      })
      continue
    }

    if (fullOrb <= 5 && moonNearNode(moon.degree, node, 12)) {
      events.push({
        date: dayKey,
        title: `Lunar Eclipse in ${moon.sign}`,
        detail: 'A rare full moon near the lunar nodes — culmination with extra intensity.',
        weight: 12,
      })
      continue
    }

    if (newOrb < bestNew.orb) bestNew = { date: dayKey, orb: newOrb, sign: moon.sign }
    if (fullOrb < bestFull.orb) bestFull = { date: dayKey, orb: fullOrb, sign: moon.sign }
  }

  const eclipseDates = new Set(events.map(e => e.date))

  if (bestNew.orb <= 5 && !eclipseDates.has(bestNew.date)) {
    events.push({
      date: bestNew.date,
      title: `New Moon in ${bestNew.sign}`,
      detail: 'A new lunar cycle begins.',
      weight: 10,
    })
  }
  if (bestFull.orb <= 5 && !eclipseDates.has(bestFull.date)) {
    events.push({
      date: bestFull.date,
      title: `Full Moon in ${bestFull.sign}`,
      detail: 'The lunar cycle reaches illumination.',
      weight: 10,
    })
  }

  return events
}

function detectRetrogradeStations(dayKeys: string[], timeZone: string): DetectedAstrologicalEvent[] {
  const events: DetectedAstrologicalEvent[] = []
  const stationKeys = new Set(['mercury', 'venus', 'mars'])

  for (const dayKey of dayKeys) {
    const planets = computeTransitingPlanets(dateKeyToNoonUtc(dayKey))
    const prev = computeTransitingPlanets(dateKeyToNoonUtc(addLocalDays(dayKey, -1, timeZone)))

    for (const planet of planets) {
      if (!stationKeys.has(planet.key)) continue
      const previous = prev.find(p => p.key === planet.key)
      if (!previous || previous.retrograde === planet.retrograde) continue

      events.push({
        date: dayKey,
        title: `${planet.label} stations ${planet.retrograde ? 'retrograde' : 'direct'}`,
        detail: planet.retrograde
          ? `${planet.label} turns retrograde — a shift in how that planet's themes unfold.`
          : `${planet.label} turns direct — forward momentum returns.`,
        weight: 10,
      })
    }
  }

  return events
}

function detectMajorIngressEvents(dayKeys: string[], timeZone: string): DetectedAstrologicalEvent[] {
  const events: DetectedAstrologicalEvent[] = []
  const majorKeys = new Set(['sun', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'])

  for (const dayKey of dayKeys) {
    const planets = computeTransitingPlanets(dateKeyToNoonUtc(dayKey))
    const prev = computeTransitingPlanets(dateKeyToNoonUtc(addLocalDays(dayKey, -1, timeZone)))

    for (const planet of planets) {
      if (!majorKeys.has(planet.key)) continue
      const previous = prev.find(p => p.key === planet.key)
      if (!previous || previous.sign === planet.sign) continue

      events.push({
        date: dayKey,
        title: `${planet.label} enters ${planet.sign}`,
        detail: `${planet.label} shifts sign — a slower, background change in the sky.`,
        weight: planet.key === 'sun' ? 10 : 9,
      })
    }
  }

  return events
}

function isNotableConjunction(a: ChartPlanet, b: ChartPlanet): boolean {
  if ((a.key === 'sun' && b.key === 'moon') || (a.key === 'moon' && b.key === 'sun')) return false
  if (OUTER_KEYS.has(a.key) || OUTER_KEYS.has(b.key)) return true
  if (a.key === 'mars' && (b.key === 'jupiter' || b.key === 'saturn')) return true
  if (b.key === 'mars' && (a.key === 'jupiter' || a.key === 'saturn')) return true
  if ((a.key === 'jupiter' && b.key === 'saturn') || (a.key === 'saturn' && b.key === 'jupiter')) return true
  return false
}

function detectSkyAlignments(dayKeys: string[]): DetectedAstrologicalEvent[] {
  const events: DetectedAstrologicalEvent[] = []

  for (const dayKey of dayKeys) {
    const planets = computeTransitingPlanets(dateKeyToNoonUtc(dayKey))
    const tracked = planets.filter(p => SKY_BODY_KEYS.includes(p.key))

    const bySign = new Map<string, ChartPlanet[]>()
    for (const planet of tracked) {
      const group = bySign.get(planet.sign) ?? []
      group.push(planet)
      bySign.set(planet.sign, group)
    }

    for (const [sign, group] of bySign) {
      if (group.length >= 4) {
        events.push({
          date: dayKey,
          title: `Major planetary alignment in ${sign}`,
          detail: `${group.map(p => p.label).join(', ')} gather in ${sign}.`,
          weight: 11,
        })
      } else if (group.length === 3 && group.some(p => OUTER_KEYS.has(p.key) || p.key === 'mars')) {
        events.push({
          date: dayKey,
          title: `Planetary alignment in ${sign}`,
          detail: `${group.map(p => p.label).join(', ')} line up in ${sign}.`,
          weight: 10,
        })
      }
    }

    for (let i = 0; i < tracked.length; i++) {
      for (let j = i + 1; j < tracked.length; j++) {
        const a = tracked[i]
        const b = tracked[j]
        if (angleDiff(a.degree, b.degree) > 3) continue
        if (!isNotableConjunction(a, b)) continue

        events.push({
          date: dayKey,
          title: `${a.label} conjunct ${b.label}`,
          detail: `A tight conjunction in the sky — ${a.label} and ${b.label} merge their themes.`,
          weight: OUTER_KEYS.has(a.key) || OUTER_KEYS.has(b.key) ? 10 : 9,
        })
      }
    }
  }

  return events
}

/**
 * Major sky highlights for today and the next two days — not personal daily transits.
 * Returns an empty array when nothing major is happening (that's expected).
 */
export function computeUpcomingAstrologicalEvents(
  _chart: unknown,
  timeZone: string,
  start: Date = new Date(),
  days = 3
): DetectedAstrologicalEvent[] {
  const dayKeys = enumerateLocalDayKeys(timeZone, start, days)

  return dedupePersistentEvents(dedupeEvents([
    ...detectEclipseAndMoonEvents(dayKeys),
    ...detectRetrogradeStations(dayKeys, timeZone),
    ...detectMajorIngressEvents(dayKeys, timeZone),
    ...detectSkyAlignments(dayKeys),
  ]))
    .sort((a, b) => a.date.localeCompare(b.date) || b.weight - a.weight)
    .slice(0, 3)
}

export function formatEventsForPrompt(
  events: DetectedAstrologicalEvent[],
  todayDateKey: string,
  timeZone: string
): string {
  if (!events.length) {
    return 'No major sky events (eclipses, lunations, planetary alignments, or retrograde stations) in the next three days.'
  }
  return events
    .map((event, i) => {
      const when = formatRelativeDay(event.date, todayDateKey, timeZone)
      return `${i + 1}. [${event.date}, ${when}] ${event.title}`
    })
    .join('\n')
}

export function mergeWesternAstrologyEvents(
  detected: DetectedAstrologicalEvent[],
  llmEvents: WesternAstrologyEvent[],
  todayDateKey: string,
  timeZone: string
): WesternAstrologyEvent[] {
  if (!detected.length) return []

  const usedLlmIndices = new Set<number>()

  return detected.map((event, index) => {
    const normalizedTitle = event.title.toLowerCase()
    const matchIndex = llmEvents.findIndex((e, i) => {
      if (usedLlmIndices.has(i)) return false
      const llmTitle = e.title.toLowerCase()
      return llmTitle.startsWith(normalizedTitle) ||
        normalizedTitle.startsWith(llmTitle.split(' —')[0] ?? '')
    })

    const llmMatch = matchIndex >= 0 ? llmEvents[matchIndex] : llmEvents[index]
    if (matchIndex >= 0) usedLlmIndices.add(matchIndex)

    return {
      title: event.title,
      timing: formatRelativeDay(event.date, todayDateKey, timeZone),
      impact: llmMatch?.impact ??
        `Notice how this sky event might ripple through your chart — inwardly, as context rather than a forecast.`,
    }
  })
}

export function resolveTimeZone(requested?: string): string {
  if (!requested) return 'UTC'
  try {
    Intl.DateTimeFormat(undefined, { timeZone: requested })
    return requested
  } catch {
    return 'UTC'
  }
}

export { formatRelativeDay as formatEventTiming, localDateKey }
