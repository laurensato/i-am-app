export type JournalEntry = {
  id: string
  content: string
  entry_month: string
  created_at: string
}

export type JournalMonthBook = {
  entryMonth: string
  label: string
  entryCount: number
}

const BOOK_SPINE_COLORS = [
  '#6B6154',
  '#5C6B8A',
  '#6E8F63',
  '#A98B4F',
  '#7A6A8A',
  '#B97A5A',
  '#8FAE84',
  '#B15E4E',
] as const

export function getEntryMonth(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

export function formatMonthLabel(entryMonth: string): string {
  const date = new Date(`${entryMonth}T12:00:00`)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function formatEntryDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatEntryTime(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function entriesForMonth(entries: JournalEntry[], entryMonth: string): JournalEntry[] {
  return entries
    .filter(entry => entry.entry_month === entryMonth)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export function groupEntriesByMonth(entries: JournalEntry[]): JournalMonthBook[] {
  const counts = new Map<string, number>()

  for (const entry of entries) {
    counts.set(entry.entry_month, (counts.get(entry.entry_month) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([entryMonth, entryCount]) => ({
      entryMonth,
      label: formatMonthLabel(entryMonth),
      entryCount,
    }))
}

export function spineColorForMonth(entryMonth: string): string {
  let hash = 0
  for (let i = 0; i < entryMonth.length; i += 1) {
    hash = (hash + entryMonth.charCodeAt(i)) % BOOK_SPINE_COLORS.length
  }
  return BOOK_SPINE_COLORS[hash]
}

export function bookHeightPx(entryCount: number): number {
  return Math.min(148, 96 + entryCount * 6)
}

export function entrySnippet(content: string, maxLength = 120): string {
  const trimmed = content.trim().replace(/\s+/g, ' ')
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength)}…`
}
