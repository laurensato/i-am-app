export type WesternAstrologyEvent = {
  title: string
  timing: string
  impact: string
}

export type WesternAstrologyDailyReading = {
  headline: string
  aspects: { label: string; reflection: string }[]
  summary: string
  events: WesternAstrologyEvent[]
}

function isValidEvents(events: unknown): events is WesternAstrologyEvent[] {
  return (
    Array.isArray(events) &&
    events.every(
      e =>
        typeof e?.title === 'string' &&
        typeof e?.timing === 'string' &&
        typeof e?.impact === 'string'
    )
  )
}

export function parseWesternAstrologyReading(content: string): WesternAstrologyDailyReading | null {
  try {
    const parsed = JSON.parse(content) as Partial<WesternAstrologyDailyReading>
    if (
      typeof parsed.headline === 'string' &&
      typeof parsed.summary === 'string' &&
      Array.isArray(parsed.aspects) &&
      parsed.aspects.length > 0 &&
      parsed.aspects.every(
        a => typeof a?.label === 'string' && typeof a?.reflection === 'string'
      ) &&
      isValidEvents(parsed.events)
    ) {
      return parsed as WesternAstrologyDailyReading
    }
  } catch {
    // not JSON
  }
  return null
}

export function isWesternAstrologyReading(content: string): boolean {
  return parseWesternAstrologyReading(content) !== null
}
