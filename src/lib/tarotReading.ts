export type TarotDailyReading = {
  cardMeaning: string
  summary: string
}

export type TarotMultiReading = {
  items: { label: string; reflection: string }[]
  summary: string
  headline?: string
}

/** Daily single-card reading: card meaning prose, then the reading — no bullet list. */
export function parseTarotDailyReading(content: string): TarotDailyReading | null {
  try {
    const parsed = JSON.parse(content)
    if (typeof parsed?.summary !== 'string') return null

    if (typeof parsed.card_meaning === 'string' && parsed.card_meaning.trim()) {
      return {
        cardMeaning: parsed.card_meaning.trim(),
        summary: parsed.summary.trim(),
      }
    }

    // Legacy shape: one entry in cards[]
    if (Array.isArray(parsed.cards) && parsed.cards.length === 1) {
      const reflection = parsed.cards[0]?.reflection
      if (typeof reflection === 'string' && reflection.trim()) {
        return {
          cardMeaning: reflection.trim(),
          summary: parsed.summary.trim(),
        }
      }
    }
  } catch {
    // not JSON
  }
  return null
}

export function parseTarotMultiReading(content: string): TarotMultiReading | null {
  try {
    const parsed = JSON.parse(content)
    if (parsed?.summary && Array.isArray(parsed?.cards) && parsed.cards.length > 1) {
      return {
        headline: parsed.headline,
        items: parsed.cards.map((c: { position: string; reflection: string }) => ({
          label: c.position,
          reflection: c.reflection,
        })),
        summary: parsed.summary,
      }
    }
  } catch {
    // not JSON
  }
  return null
}

export function formatTarotDailyJournalBody(reading: TarotDailyReading): string {
  return `${reading.cardMeaning}\n\n${reading.summary}`
}

export function formatTarotMultiJournalBody(reading: TarotMultiReading): string {
  const sections: string[] = []
  if (reading.headline) sections.push(reading.headline)
  if (reading.items.length) {
    sections.push(reading.items.map(item => `${item.label}: ${item.reflection}`).join('\n'))
  }
  sections.push('')
  sections.push(reading.summary)
  return sections.join('\n')
}
