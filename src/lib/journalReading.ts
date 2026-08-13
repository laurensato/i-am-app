import { dateKeyToNoonUtc } from '@/lib/localDate'
import { parseWesternAstrologyReading, type WesternAstrologyDailyReading } from '@/lib/structuredReading'
import {
  formatTarotDailyJournalBody,
  formatTarotMultiJournalBody,
  parseTarotDailyReading,
  parseTarotMultiReading,
} from '@/lib/tarotReading'
import { FACTOR_META, type FactorType } from '@/lib/types'

export type ReadingPeriod = 'daily' | 'weekly'

export type TarotReadingCard = {
  name: string
  position: string
  reversed?: boolean
}

type StructuredReading = {
  headline?: string
  items: { label: string; reflection: string }[]
  summary: string
}

export function userTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function todayDateKey(timeZone = userTimezone()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function readingDateLabel(date = new Date(), timeZone = userTimezone()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatDateKeyLabel(dateKey: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(dateKeyToNoonUtc(dateKey))
}

export function readingStorageKey(
  userId: string,
  factor: FactorType,
  period: ReadingPeriod,
  periodKey: string,
): string {
  return `journal_saved:${userId}:${factor}:${period}:${periodKey}`
}

function periodLabel(period: ReadingPeriod): string {
  return period === 'weekly' ? 'Weekly Reading' : 'Daily Reading'
}

function formatJournalHeader(factorLabel: string, period: ReadingPeriod, dateLabel: string): string {
  return `${factorLabel} — ${periodLabel(period)}\n${dateLabel}`
}

function formatStructuredItems(items: { label: string; reflection: string }[]): string {
  return items.map(item => `${item.label}: ${item.reflection}`).join('\n')
}

function formatStructuredBody(reading: StructuredReading): string {
  const sections: string[] = []
  if (reading.headline) sections.push(reading.headline)
  if (reading.items.length) sections.push(formatStructuredItems(reading.items))
  sections.push('')
  sections.push(reading.summary)
  return sections.join('\n')
}

function formatWesternAstrologyBody(reading: WesternAstrologyDailyReading): string {
  const sections: string[] = []

  if (reading.events.length > 0) {
    sections.push('On the Horizon')
    for (const event of reading.events) {
      sections.push(`${event.title} (${event.timing})\n${event.impact}`)
    }
    sections.push('')
  }

  sections.push("Today's Insight")
  if (reading.headline) sections.push(reading.headline)
  sections.push(formatStructuredItems(reading.aspects))
  sections.push('')
  sections.push(reading.summary)

  return sections.join('\n')
}

function formatCardsSection(cards: TarotReadingCard[]): string {
  const lines = cards.map(
    card => `${card.name}${card.reversed ? ' (Reversed)' : ''} — ${card.position}`,
  )
  return `Cards:\n${lines.join('\n')}\n\n`
}

export function formatFactorDailyReading(
  factor: FactorType,
  rawContent: string,
  dateLabel = readingDateLabel(),
): string {
  const factorLabel = FACTOR_META[factor].label
  const header = formatJournalHeader(factorLabel, 'daily', dateLabel)

  if (factor === 'western_astrology') {
    const reading = parseWesternAstrologyReading(rawContent)
    if (reading) {
      return `${header}\n\n${formatWesternAstrologyBody(reading)}`
    }
  }

  return `${header}\n\n${rawContent.trim()}`
}

export function formatTarotJournalReading(
  period: ReadingPeriod,
  rawContent: string,
  cards: TarotReadingCard[],
  dateLabel: string,
): string {
  const header = formatJournalHeader(FACTOR_META.tarot.label, period, dateLabel)
  const cardsSection = cards.length ? formatCardsSection(cards) : ''

  if (period === 'daily') {
    const daily = parseTarotDailyReading(rawContent)
    const body = daily ? formatTarotDailyJournalBody(daily) : rawContent.trim()
    return `${header}\n\n${cardsSection}${body}`
  }

  const parsed = parseTarotMultiReading(rawContent)
  const body = parsed ? formatTarotMultiJournalBody(parsed) : rawContent.trim()

  return `${header}\n\n${cardsSection}${body}`
}
