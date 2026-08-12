/** Calendar-date helpers that respect a local timezone (not UTC midnight from toISOString). */

export function localDateKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find(p => p.type === 'year')!.value
  const month = parts.find(p => p.type === 'month')!.value
  const day = parts.find(p => p.type === 'day')!.value
  return `${year}-${month}-${day}`
}

export function localDateLabel(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function localWeekday(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' }).format(date)
}

/** Noon UTC on a YYYY-MM-DD key — stable enough for daily transit positions. */
export function dateKeyToNoonUtc(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

export function addLocalDays(dateKey: string, days: number, timeZone: string): string {
  const anchor = dateKeyToNoonUtc(dateKey)
  return localDateKey(new Date(anchor.getTime() + days * 86_400_000), timeZone)
}

export function formatRelativeDay(
  eventDateKey: string,
  todayDateKey: string,
  timeZone: string
): string {
  if (eventDateKey === todayDateKey) return 'Today'

  const tomorrowKey = addLocalDays(todayDateKey, 1, timeZone)
  if (eventDateKey === tomorrowKey) return 'Tomorrow'

  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(dateKeyToNoonUtc(eventDateKey))
}

export function enumerateLocalDayKeys(timeZone: string, start: Date, count: number): string[] {
  const first = localDateKey(start, timeZone)
  return Array.from({ length: count }, (_, i) => addLocalDays(first, i, timeZone))
}

/** Sunday-start week key (YYYY-MM-DD of the week's first day). */
export function weekStartKey(date: Date, timeZone: string): string {
  let cursor = localDateKey(date, timeZone)
  for (let i = 0; i < 7; i++) {
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'long',
    }).format(dateKeyToNoonUtc(cursor))
    if (weekday === 'Sunday') return cursor
    cursor = addLocalDays(cursor, -1, timeZone)
  }
  return localDateKey(date, timeZone)
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

/** True when prose explicitly names a weekday other than the correct one. */
export function insightMentionsOtherWeekday(insight: string, correctWeekday: string): boolean {
  return WEEKDAYS.some(
    day => day !== correctWeekday && new RegExp(`\\b${day}\\b`, 'i').test(insight),
  )
}

export function formatTodayForPrompt(date: Date, timeZone: string): {
  dateKey: string
  weekday: string
  label: string
} {
  const dateKey = localDateKey(date, timeZone)
  const weekday = localWeekday(date, timeZone)
  const label = localDateLabel(date, timeZone)
  return { dateKey, weekday, label }
}
