import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { computeTransitingPlanets, computeTransitAspects, wholeSignAspect, NatalChart } from '@/lib/natalChart'
import { drawTarotCards } from '@/lib/tarotDeck'
import {
  computeUpcomingAstrologicalEvents,
  formatEventsForPrompt,
  mergeWesternAstrologyEvents,
  resolveTimeZone,
} from '@/lib/astrologicalEvents'
import { localDateKey, localDateLabel, localWeekday } from '@/lib/localDate'
import { isWesternAstrologyReading, parseWesternAstrologyReading, type WesternAstrologyEvent } from '@/lib/structuredReading'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, dangerouslyAllowBrowser: true })

type SnapshotKind = 'content' | 'content_v2' | 'content_v3' | 'content_v4' | 'content_v5' | 'content_v6' | 'mantra' | 'cards'
type FactorSnapshots = Record<string, Partial<Record<SnapshotKind, string>>>

function factorContentKind(factor: string): SnapshotKind {
  return factor === 'western_astrology' ? 'content_v6' : 'content'
}

// The model sometimes wraps JSON output in a markdown code fence despite being told not to —
// strip it before parsing so that doesn't silently trigger the fallback path.
function stripJsonFence(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
}

// Reuses (or creates) today's cached value for a factor, so a reading is only generated
// once per day and stays the same for the rest of the day, instead of regenerating on every visit.
async function getOrCreateSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  today: string,
  factor: string,
  kind: SnapshotKind,
  generate: () => Promise<string>,
  options?: { skipCache?: boolean; isValid?: (value: string) => boolean }
): Promise<string> {
  const { data: existing } = await supabase
    .from('daily_messages')
    .select('factor_snapshots')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  const snapshots = (existing?.factor_snapshots ?? {}) as FactorSnapshots

  if (!options?.skipCache) {
    const cached = snapshots[factor]?.[kind]
    if (cached && (!options?.isValid || options.isValid(cached))) return cached
  }

  const value = await generate()

  const nextSnapshots: FactorSnapshots = { ...snapshots, [factor]: { ...snapshots[factor], [kind]: value } }
  await supabase.from('daily_messages').upsert({
    user_id: userId,
    date: today,
    factor_snapshots: nextSnapshots,
  }, { onConflict: 'user_id,date' })

  return value
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { factor, factorResults, profile: bodyProfile, mantraOnly, cardsOnly, forceRefresh, timezone } = body
  const timeZone = resolveTimeZone(timezone)
  const today = localDateKey(new Date(), timeZone)

  // If requesting just today's spiritual mantra (for the dashboard card)
  if (factor === 'spirituality' && factorResults && mantraOnly) {
    const mantra = await getOrCreateSnapshot(supabase, user.id, today, factor, 'mantra',
      () => generateSpiritualityMantra(factorResults))
    return NextResponse.json({ mantra })
  }

  // If requesting just today's tarot draw (drawn once per day, cached, shown before the reading)
  if (factor === 'tarot' && cardsOnly) {
    const cardsJson = await getOrCreateSnapshot(supabase, user.id, today, factor, 'cards',
      async () => JSON.stringify(drawTarotCards()))
    return NextResponse.json({ cards: JSON.parse(cardsJson) })
  }

  // If requesting a specific factor's daily content
  if (factor && factorResults) {
    // Tarot's daily reading is always about today's freshly-drawn cards, not whatever cards
    // were originally drawn at discovery — override with the same cached daily draw used above
    // so the reading matches whatever the person actually revealed.
    let effectiveResults = factorResults
    if (factor === 'tarot') {
      const cardsJson = await getOrCreateSnapshot(supabase, user.id, today, factor, 'cards',
        async () => JSON.stringify(drawTarotCards()))
      effectiveResults = { ...factorResults, cards: JSON.parse(cardsJson) }
    }

    const contentKind = factorContentKind(factor)
    const content = await getOrCreateSnapshot(
      supabase, user.id, today, factor, contentKind,
      () => generateFactorContent(factor, effectiveResults, bodyProfile, timeZone),
      {
        skipCache: !!(forceRefresh && factor === 'western_astrology'),
        isValid: factor === 'western_astrology' ? isWesternAstrologyReading : undefined,
      }
    )
    return NextResponse.json({ factor_content: content })
  }

  // Check if we already have today's daily message
  const { data: existing } = await supabase
    .from('daily_messages')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (existing?.insight && existing?.mantra) {
    return NextResponse.json({ insight: existing.insight, mantra: existing.mantra })
  }

  // Fetch user profile and completed factors
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: factors } = await supabase
    .from('identity_factors')
    .select('*')
    .eq('user_id', user.id)
    .eq('discovery_completed', true)
    .eq('is_active', true)

  const profileSummary = profile
    ? `Name: ${profile.first_name}, Age: ${profile.age}, Gender: ${profile.gender}`
    : 'Unknown'

  // Generates (or reuses) each non-tarot factor's own daily reading as a side effect of
  // building this summary, so opening the dashboard is what causes every identity reading to
  // exist for the day — not waiting on the person to click into each factor's page individually.
  // Tarot is excluded: its daily draw is meant to be revealed through the flip interaction, not
  // pre-generated behind the scenes.
  const factorSummary = (await Promise.all((factors ?? []).map(async f => {
    const r = f.results as Record<string, unknown>
    switch (f.factor_type) {
      case 'tarot':
        return `Tarot cards drawn: ${((r as {cards?:{name:string}[]}).cards ?? []).map(c => c.name).join(', ')}`
      case 'western_astrology':
      case 'eastern_astrology':
      case 'spirituality':
      case 'values':
      case 'ikigai': {
        const labels: Record<string, string> = { western_astrology: 'Western Astrology', eastern_astrology: 'Eastern Astrology', spirituality: 'Spirituality', values: 'Values', ikigai: 'Ikigai' }
        const label = labels[f.factor_type as string]
        const contentKind = factorContentKind(f.factor_type)
        const todaysReading = await getOrCreateSnapshot(
          supabase, user.id, today, f.factor_type, contentKind,
          () => generateFactorContent(f.factor_type, r, profile, timeZone),
          {
            isValid: f.factor_type === 'western_astrology' ? isWesternAstrologyReading : undefined,
          }
        )
        return `${label} today: ${formatFactorReadingForSummary(f.factor_type, todaysReading)}`
      }
      default: return ''
    }
  }))).filter(Boolean).join('\n')

  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  const prompt = `You are a wise, warm, and grounding personal guide for someone navigating a meaningful life transition — often called a "midlife" moment. They are discovering themselves through multiple lenses of identity.

Person: ${profileSummary}
Today: ${dayOfWeek}, ${dateStr}

What we know about them:
${factorSummary || 'They are just beginning their journey of self-discovery.'}

Generate a daily message for them. The insight should be 2-3 sentences — personal, reflective, and grounded in what we know about them. It should feel like it was written specifically for them, not generic.${profile?.first_name ? ` Address them by name — "${profile.first_name}" — at least once.` : ''} You have no record of what was said to them on any previous day, so write only about today — do not reference yesterday, an ongoing streak, or how their journey has been unfolding "lately." Ground the message in who they are (the identity factors above) and today's date, not in any implied history.

The mantra should be 5-10 words that capture today's invitation to them. It should feel like something they could actually say to themselves.

Return JSON only:
{
  "insight": "2-3 sentence personal insight drawing on their identity factors and the day",
  "mantra": "short mantra for today"
}
No markdown formatting of any kind — not in the JSON structure, and not inside any string values. Write all text as plain prose.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const block = response.content[0]
    if (block.type !== 'text') throw new Error('Unexpected response content type')

    const { insight, mantra } = JSON.parse(stripJsonFence(block.text))
    if (!insight || !mantra) throw new Error('Model returned incomplete daily message')

    await supabase.from('daily_messages').upsert({
      user_id: user.id,
      date: today,
      insight,
      mantra,
    }, { onConflict: 'user_id,date' })

    return NextResponse.json({ insight, mantra })
  } catch {
    const fallback = {
      insight: 'You are in the middle of something — not the beginning and not the end. That discomfort you feel is the feeling of becoming.',
      mantra: 'I am enough, right now.',
    }

    await supabase.from('daily_messages').upsert({
      user_id: user.id,
      date: today,
      ...fallback,
    }, { onConflict: 'user_id,date' })

    return NextResponse.json(fallback)
  }
}

async function generateSpiritualityMantra(results: Record<string, unknown>): Promise<string> {
  const r = results as { traditions?: string[]; themes?: string[] }

  const prompt = `You are a multi-tradition spiritual guide. Resonant spiritual traditions: ${(r.traditions ?? []).join(', ')}.
Core spiritual themes: ${(r.themes ?? []).join(', ')}.

Write a single short mantra (5-10 words) for today, grounded in these resonant traditions and themes. It must be written entirely in the first person, as something they would actually say to themselves — e.g. "I trust the unfolding" — never in the third person and never referring to "this person" or "they." Simple and resonant, not a full sentence of explanation. Plain text only, no quotation marks, no markdown.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 60,
      messages: [{ role: 'user', content: prompt }],
    })
    return response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  } catch {
    return 'I am at peace with the mystery.'
  }
}

async function generateFactorContent(
  factor: string,
  results: Record<string, unknown>,
  profile: { first_name: string; age: number; gender: string } | null,
  timeZone: string
): Promise<string> {
  const now = new Date()
  const dayOfWeek = localWeekday(now, timeZone)
  const firstName = profile?.first_name?.trim()
  const personalization = firstName
    ? ` Address ${firstName} by name at least once, and write in second person ("you") throughout — never refer to them in the third person or as "this person"/"they." This should feel written specifically for ${firstName}, not generic. Write plain prose only — no asterisks, no bold, no italics, no markdown of any kind.`
    : ` Write in warm second person ("you") throughout — never refer to them in the third person or as "this person"/"they." This should feel personal and specific, not generic. Write plain prose only — no asterisks, no bold, no italics, no markdown of any kind.`

  if (factor === 'tarot') {
    return generateTarotReading(results, dayOfWeek, personalization)
  }

  if (factor === 'western_astrology') {
    return generateWesternAstrologyReading(results, dayOfWeek, personalization, timeZone)
  }

  const factorPrompts: Record<string, string> = {
    eastern_astrology: `You are a Chinese astrology guide. Today is ${dayOfWeek}. Generate a personalized daily reflection (3-4 sentences) for a ${(results as {element?:string}).element} ${(results as {animal?:string}).animal}.
Draw on the energy and wisdom of their sign and element. Warm and grounding.${personalization}`,

    spirituality: `You are a multi-tradition spiritual guide. Today is ${dayOfWeek}. Resonant spiritual traditions: ${((results as {traditions?:string[]}).traditions ?? []).join(', ')}.
Core spiritual themes: ${((results as {themes?:string[]}).themes ?? []).join(', ')}.
Offer a brief wisdom teaching (3-4 sentences) that weaves together insights from these resonant traditions. Inclusive and non-dogmatic.${personalization}`,

    values: `You are a values coach. Today is ${dayOfWeek}. Core values: ${((results as {top_values?:string[]}).top_values ?? []).join(', ')}.
Offer a brief daily reflection (3-4 sentences) that invites them to notice or practice one of these values today. Concrete and warm.${personalization}`,

    ikigai: `You are an ikigai guide. Today is ${dayOfWeek}. Their reason for being: "${(results as {ikigai_statement?:string}).ikigai_statement}".
Offer a brief daily reflection (3-4 sentences) that helps them live their ikigai today in a small, practical way. Grounding and encouraging.${personalization}`,
  }

  const prompt = factorPrompts[factor]
  if (!prompt) return 'Today is an invitation to reflect on this aspect of yourself.'

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = response.content[0]
    if (block.type !== 'text' || !block.text) throw new Error('Unexpected response content type')
    return block.text
  } catch {
    return 'Today is an invitation to sit with what you know about yourself through this lens.'
  }
}

function formatFactorReadingForSummary(factor: string, content: string): string {
  if (factor === 'western_astrology') {
    const reading = parseWesternAstrologyReading(content)
    if (reading) return `${reading.headline}. ${reading.summary}`
  }
  if (factor === 'tarot') {
    try {
      const parsed = JSON.parse(content) as { summary?: string }
      if (parsed.summary) return parsed.summary
    } catch {
      // not JSON — use raw content
    }
  }
  return content
}

// Computes today's real transiting planets and, where possible, how they actually aspect the
// person's natal chart — so the reading is grounded in a real current sky, not an invented one.
async function generateWesternAstrologyReading(
  results: Record<string, unknown>,
  dayOfWeek: string,
  personalization: string,
  timeZone: string
): Promise<string> {
  const r = results as { sun_sign?: string; moon_sign?: string; rising_sign?: string; chart?: NatalChart }
  const now = new Date()
  const todayDateKey = localDateKey(now, timeZone)
  const todayLabel = localDateLabel(now, timeZone)
  const transiting = computeTransitingPlanets()
  const transitingSun = transiting.find(p => p.key === 'sun')
  const transitingMoon = transiting.find(p => p.key === 'moon')

  const patternLines: string[] = []
  if (transitingSun) patternLines.push(`Transiting Sun is currently in ${transitingSun.sign}.`)
  if (transitingMoon) patternLines.push(`Transiting Moon is currently in ${transitingMoon.sign}.`)

  if (r.chart?.planets?.length) {
    for (const a of computeTransitAspects(transiting, r.chart.planets).slice(0, 5)) {
      patternLines.push(`Transiting ${a.transitPlanet} is ${a.aspect} their natal ${a.natalPlanet}.`)
    }
  } else {
    const natalPoints: { label: string; sign?: string }[] = [
      { label: 'Sun', sign: r.sun_sign },
      { label: 'Moon', sign: r.moon_sign },
      { label: 'Rising', sign: r.rising_sign },
    ]
    for (const t of [transitingSun, transitingMoon]) {
      if (!t) continue
      for (const n of natalPoints) {
        if (!n.sign) continue
        const aspect = wholeSignAspect(t.sign, n.sign)
        if (aspect) patternLines.push(`Transiting ${t.label} in ${t.sign} is ${aspect} their natal ${n.label} in ${n.sign}.`)
      }
    }
  }

  const patterns = patternLines.length
    ? patternLines.map((line, i) => `${i + 1}. ${line}`).join('\n')
    : `1. Transiting Sun is in ${transitingSun?.sign ?? 'motion'}.`

  const upcomingEvents = computeUpcomingAstrologicalEvents(undefined, timeZone, now)
  const upcomingEventsText = formatEventsForPrompt(upcomingEvents, todayDateKey, timeZone)
  const hasHighlights = upcomingEvents.length > 0

  const fallback = () => JSON.stringify({
    headline: 'The sky is speaking through your chart today',
    aspects: patternLines.slice(0, 3).map(line => ({
      label: line.replace(/\.$/, ''),
      reflection: 'Sit with how this pattern might be showing up in your inner world today — not as a prediction, but as an invitation to notice.',
    })),
    summary: 'Your chart holds the blueprint of your becoming. Today, let one of these active patterns guide you inward.',
    events: mergeWesternAstrologyEvents(upcomingEvents, [], todayDateKey, timeZone),
  })

  const highlightsSection = hasHighlights
    ? `Major sky highlights for today and the next two days (each title listed once — write exactly one "events" entry per highlight below, no duplicates):
${upcomingEventsText}

For each highlight, write only "title" (exactly as given) and "impact" (2-3 sentences on how this sky event interacts with their natal chart). Each title must appear at most once in your events array. Do not repeat themes from the daily aspects above. Do not say "today" or "tomorrow" in the impact.`
    : `There are no major sky highlights in the next three days (no eclipses, lunations, alignments, or retrograde stations). Return an empty "events" array. Do not invent highlight events.`

  const prompt = `You are an astrologer. Today is ${dayOfWeek}, ${todayLabel} (${todayDateKey}) in the user's local timezone.

Their natal chart: Sun ${r.sun_sign}, Moon ${r.moon_sign}, Rising ${r.rising_sign}.

Today's personal transits and patterns (use for the daily reading below — do not repeat these in highlights):
${patterns}

${highlightsSection}

Write a structured daily horoscope for TODAY grounded in how their natal chart is experiencing the personal transits listed above. Weight the reading on those patterns — their natal placements are the lens. Reflective and grounded, not predictive. Focus on inner themes.${personalization}

First write a short headline (5-10 words) that captures today's overall tone.

Then choose the 3-4 most meaningful patterns from today's transit list and, for each, write exactly 1-2 sentences in "reflection".

Then write a separate 3-4 sentence "summary" that weaves those aspects into one cohesive narrative.

Return JSON only, in this exact shape:
{
  "headline": "...",
  "aspects": [{ "label": "...", "reflection": "..." }],
  "summary": "...",
  "events": [{ "title": "...", "impact": "..." }]
}
Keep each reflection to 1-2 sentences and the summary to 3-4 sentences. No markdown formatting of any kind. Write all text as plain prose.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2400,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = response.content[0]
    if (block.type !== 'text' || !block.text) throw new Error('Unexpected response content type')
    if (response.stop_reason === 'max_tokens') throw new Error('Model response truncated')

    const parsed = JSON.parse(stripJsonFence(block.text)) as {
      headline?: string
      aspects?: { label: string; reflection: string }[]
      summary?: string
      events?: { title?: string; impact?: string; timing?: string }[]
    }
    if (!parsed.headline || !parsed.summary || !parsed.aspects?.length) {
      throw new Error('Model returned incomplete western astrology reading')
    }

    const llmEvents: WesternAstrologyEvent[] = (parsed.events ?? []).map(event => ({
      title: event.title ?? '',
      timing: '',
      impact: event.impact ?? '',
    }))

    const reading = {
      headline: parsed.headline,
      aspects: parsed.aspects,
      summary: parsed.summary,
      events: mergeWesternAstrologyEvents(upcomingEvents, llmEvents, todayDateKey, timeZone),
    }

    if (!isWesternAstrologyReading(JSON.stringify(reading))) {
      throw new Error('Model returned incomplete western astrology reading')
    }

    return JSON.stringify(reading)
  } catch {
    return fallback()
  }
}

// The tarot daily reading is structured (a short reflection per card, then a woven-together
// summary) rather than a single paragraph, so it gets its own JSON-shaped generation. The
// result is returned as a JSON string — same Promise<string> contract as the other factors —
// and the client parses it to render the per-card bullets and summary separately.
async function generateTarotReading(
  results: Record<string, unknown>,
  dayOfWeek: string,
  personalization: string
): Promise<string> {
  const cards = (results as { cards?: { name: string; position: string; reversed?: boolean }[] }).cards ?? []
  const cardList = cards.map(c => `${c.position}: ${c.name}${c.reversed ? ' (reversed)' : ''}`).join('\n')

  const fallback = () => JSON.stringify({
    cards: cards.map(c => ({ position: c.position, reflection: `The energy of ${c.name} is still unfolding — sit with what it stirred in you.` })),
    summary: 'Your cards spoke. Their message is still alive. What has unfolded since you drew them?',
  })

  if (!cards.length) return fallback()

  const prompt = `You are a tarot reader. Today is ${dayOfWeek}. These cards were drawn:
${cardList}

For each card, write a 2-3 sentence reflection that names what that card traditionally means and how that meaning might be showing up today, in new ways. Reflective, not predictive.${personalization}

Then write a separate 3-4 sentence summary that interprets the three cards together as one cohesive reading — how the meanings build on or play off each other across past, present, and future, not just a recap of each card individually.

Return JSON only, in this exact shape, with one "cards" entry per card above using its exact position name:
{
  "cards": [{ "position": "...", "reflection": "..." }],
  "summary": "..."
}
No markdown formatting of any kind — not in the JSON structure, and not inside any string values. Write all text as plain prose.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = response.content[0]
    if (block.type !== 'text') throw new Error('Unexpected response content type')

    const parsed = JSON.parse(stripJsonFence(block.text)) as { cards?: { position: string; reflection: string }[]; summary?: string }
    if (!parsed.summary || !parsed.cards?.length) throw new Error('Model returned incomplete tarot reading')

    return JSON.stringify(parsed)
  } catch {
    return fallback()
  }
}
