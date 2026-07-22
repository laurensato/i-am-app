import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { geocodeBirthPlace, computeNatalChart } from '@/lib/natalChart'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, dangerouslyAllowBrowser: true })

const STATIC_FALLBACKS: Record<string, (data: Record<string, unknown>, firstName?: string) => unknown> = {
  western_astrology: (data, firstName) => {
    const d = data as { birthDate?: string; birthPlace?: string }
    const name = firstName ? `${firstName}, your` : 'Your'
    return {
      results: {
        sun_sign: 'Scorpio',
        moon_sign: 'Cancer',
        rising_sign: 'Libra',
        summary: `${name} Sun is in Scorpio — deep, transformative, and intensely perceptive. Your Moon in Cancer speaks to a rich inner life and deep emotional intelligence. Your Libra rising presents a graceful, diplomatic face to the world, seeking harmony in all things.`,
        essence: 'Deep waters, graceful diplomacy, quiet intensity',
      }
    }
  },
}

// Prompts for backfilling a missing "essence" phrase on a result saved before that field existed,
// without re-interpreting the reading or generating a new summary.
const BACKFILL_ESSENCE_PROMPTS: Record<string, (data: Record<string, unknown>) => string> = {
  tarot: (data) => {
    const { cards, summary } = data as { cards: unknown; summary?: string }
    return `You are a wise, compassionate tarot reader. Here is a reading that was already given:

Cards drawn:
${JSON.stringify(cards, null, 2)}

Summary given: "${summary ?? ''}"

Write a short phrase (3-6 words) that captures the core message or feeling of this specific reading — evocative, not generic, e.g. "Release control, trust the current".`
  },
  western_astrology: (data) => {
    const { sun_sign, moon_sign, rising_sign, summary } = data as { sun_sign?: string; moon_sign?: string; rising_sign?: string; summary?: string }
    return `You are an expert Western astrologer. Here is a natal chart reading that was already given:

Sun: ${sun_sign}, Moon: ${moon_sign}, Rising: ${rising_sign}
Summary given: "${summary ?? ''}"

Write a short phrase (4-8 words) that captures the essence of this person's cosmic nature — evocative, not generic, e.g. "Deep waters, graceful diplomacy, quiet intensity".`
  },
  eastern_astrology: (data) => {
    const { animal, element, yin_yang, summary } = data as { animal?: string; element?: string; yin_yang?: string; summary?: string }
    return `You are an expert in Chinese astrology. Here is a zodiac reading that was already given:

${element} ${animal} (${yin_yang})
Summary given: "${summary ?? ''}"

Write a short phrase (4-8 words) that captures the essence of this sign and element combination — evocative, not generic, e.g. "Steady fire, quiet resilience, loyal heart".`
  },
  ikigai: (data) => {
    const { ikigai_statement, love, good_at, world_needs, paid_for } = data as { ikigai_statement?: string; love?: string[]; good_at?: string[]; world_needs?: string[]; paid_for?: string[] }
    return `You are a life coach specializing in ikigai and purpose. Here is someone's ikigai reading that was already given:

Reason for being: "${ikigai_statement ?? ''}"
What they love: ${JSON.stringify(love)}
What they're good at: ${JSON.stringify(good_at)}
What the world needs: ${JSON.stringify(world_needs)}
What they can be paid for: ${JSON.stringify(paid_for)}

Choose a single word — one word only, no phrase — that captures or represents this person's ikigai. Evocative and specific to them, not generic (avoid just returning "Ikigai" or "Purpose"). Title case.`
  },
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { factor, data, profile, backfillEssence, backfillQuote } = await req.json()

  // Backfill a missing literary quote on a values result saved before that field existed.
  if (factor === 'values' && backfillQuote) {
    const { top_values, reflections } = data as { top_values?: string[]; reflections?: Record<string, string> }
    const prompt = `You are a values coach and depth psychologist. Here is someone's top 5 values, in priority order: ${JSON.stringify(top_values)}.
Their own reflections on why each matters:
${JSON.stringify(reflections, null, 2)}

Select one single-sentence quote from real, published literature — a novel, poem, play, or classic essay, not a self-help book, not a movie, not song lyrics — that resonates with these values as a whole. This must be a genuine, accurately-worded quote from a well-known work that you are confident about. Prefer something widely known and frequently anthologized over something obscure, since accuracy matters far more than originality here — if you are not confident of the exact wording or attribution of a quote, choose a different, more famous one instead. Never invent a quote or misattribute one.

Return a JSON object:
{
  "text": "The single-sentence quote, verbatim",
  "author": "The author's name",
  "work": "The title of the book, poem, or play it's from"
}
Return only the JSON, no markdown.`

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const literary_quote = JSON.parse(text)
      return NextResponse.json({ literary_quote })
    } catch {
      return NextResponse.json({ error: 'Failed to generate quote' }, { status: 500 })
    }
  }

  // Backfill a missing "essence" phrase for a result saved before that field existed.
  if (backfillEssence && BACKFILL_ESSENCE_PROMPTS[factor]) {
    const prompt = `${BACKFILL_ESSENCE_PROMPTS[factor](data as Record<string, unknown>)} Return only the phrase, no quotes, no markdown, nothing else.`

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 60,
        messages: [{ role: 'user', content: prompt }],
      })
      const essence = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
      return NextResponse.json({ essence })
    } catch {
      return NextResponse.json({ error: 'Failed to generate essence' }, { status: 500 })
    }
  }

  const firstName: string | undefined = (profile as { first_name?: string } | null)?.first_name?.trim() || undefined

  const personalization = firstName
    ? `You are writing directly to ${firstName}. Address them by name at least once in the summary (e.g. "${firstName}, ..."), and write in second person ("you") throughout — never refer to them in the third person or as "this person"/"they." This should feel like it was written specifically for ${firstName} — personal and specific, not a generic reading anyone could receive.`
    : `Write in warm second person ("you") throughout — never refer to them in the third person or as "this person"/"they." This should feel personal and specific to this individual, not a generic reading.`

  // For western astrology, try a real computed natal chart (real planetary positions, houses, aspects)
  // instead of asking the model to calculate positions. Falls through to the LLM-guess prompt below on failure
  // (e.g. birth place couldn't be geocoded).
  if (factor === 'western_astrology') {
    try {
      const d = data as { birthDate?: string; birthTime?: string; birthPlace?: string }
      if (!d.birthDate) throw new Error('missing birth date')
      const coords = await geocodeBirthPlace(d.birthPlace ?? '')
      if (!coords) throw new Error('could not geocode birth place')

      const chart = computeNatalChart({ birthDate: d.birthDate, birthTime: d.birthTime, lat: coords.lat, lon: coords.lon })

      const narrativePrompt = `${personalization}

You are an expert Western astrologer. This person's natal chart has already been precisely calculated — do not recalculate anything, just interpret it warmly.

Sun: ${chart.sunSign}
Moon: ${chart.moonSign}
Rising: ${chart.risingSign}
${chart.timeUnknown ? 'Note: their exact birth time was not provided, so Moon and Rising sign are approximate (calculated as if born at noon).' : ''}

Return a JSON object:
{
  "summary": "2-3 sentences weaving together the Sun, Moon, and Rising into a portrait of this person's cosmic nature. Warm, insightful, non-judgmental.",
  "essence": "A short phrase (4-8 words) that captures the essence of this person's cosmic nature — evocative, not generic, e.g. 'Deep waters, graceful diplomacy, quiet intensity'"
}
Return only the JSON, no markdown. Write all text values as plain prose — no asterisks, no bold, no italics, no markdown formatting of any kind inside the strings.`

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [{ role: 'user', content: narrativePrompt }],
      })
      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const { summary, essence } = JSON.parse(text)

      return NextResponse.json({
        results: {
          sun_sign: chart.sunSign,
          moon_sign: chart.moonSign,
          rising_sign: chart.risingSign,
          summary,
          essence,
          chart,
        },
      })
    } catch {
      // Fall through to the LLM-guess prompt below.
    }
  }

  const prompts: Record<string, string> = {
    western_astrology: `${personalization}

You are an expert Western astrologer. Given birth data, calculate and interpret the natal chart.

Birth Date: ${(data as Record<string, string>).birthDate}
Birth Time: ${(data as Record<string, string>).birthTime || 'unknown'}
Birth Place: ${(data as Record<string, string>).birthPlace}

Calculate the Sun sign, Moon sign, and Rising sign (use noon if time is unknown — estimate rising as same as sun in that case, and note that). Return a JSON object with this exact structure:
{
  "sun_sign": "Sign name",
  "moon_sign": "Sign name",
  "rising_sign": "Sign name (or 'Unknown — birth time needed')",
  "summary": "2-3 sentences weaving together these three aspects into a portrait of this person's cosmic nature. Warm, insightful, non-judgmental.",
  "essence": "A short phrase (4-8 words) that captures the essence of this person's cosmic nature — evocative, not generic, e.g. 'Deep waters, graceful diplomacy, quiet intensity'"
}
Return only the JSON, no markdown. Write all text values as plain prose — no asterisks, no bold, no italics, no markdown formatting of any kind inside the strings.`,

    eastern_astrology: `${personalization}

You are an expert in Chinese astrology with deep knowledge of the Five Elements, the 12 animals, and annual energy cycles. Given a birth year and month, determine the Chinese zodiac sign and produce a rich, layered reading.

Birth Year: ${(data as Record<string, string>).birthYear}
Birth Month: ${(data as Record<string, string>).birthMonth}

Note: The Chinese New Year falls between Jan 21 and Feb 20. If born in January or early February, they may belong to the previous year's animal. Calculate correctly.

The current year is 2026 — the Year of the Yang Fire Horse.

Return a JSON object with exactly this structure:
{
  "animal": "Animal name",
  "element": "Element (Wood/Fire/Earth/Metal/Water)",
  "yin_yang": "Yin or Yang",
  "summary": "2-3 sentences describing the overall nature of this sign and element combination. Warm and affirming.",
  "essence": "A short phrase (4-8 words) that captures the essence of this sign — evocative, not generic, e.g. 'Steady fire, quiet resilience, loyal heart'",
  "personality": {
    "core": "2-3 sentences on their core character — how this animal shows up in the world, what drives them at their best.",
    "in_relationships": "1-2 sentences on how they love, bond, and show loyalty.",
    "at_work": "1-2 sentences on how they approach work, ambition, and contribution.",
    "under_pressure": "1-2 sentences on their shadow tendencies — what emerges when stressed or out of alignment. Compassionate, not critical."
  },
  "strengths": ["3-5 specific, evocative strengths — not generic adjectives but alive phrases, e.g. 'Turns chaos into calm through sheer presence'"],
  "shadows": ["2-3 honest challenges or blind spots — stated with compassion, e.g. 'Can exhaust themselves carrying everyone else's weight'"],
  "element_nature": {
    "essence": "1-2 sentences on what this element means cosmically — its archetype, season, direction, energy.",
    "expression": "1-2 sentences on how this element specifically expresses through this animal — the unique flavor of their combination.",
    "nourished_by": "What nourishes this element — activities, environments, relationships that restore them.",
    "depleted_by": "What depletes this element — patterns or environments to be aware of."
  },
  "year_2026": {
    "year_animal": "Horse",
    "year_element": "Fire",
    "relationship": "One of: harmony, clash, neutral, penalty, or combination — the technical relationship between their animal and the Horse year",
    "relationship_quality": "One of: supportive, challenging, or neutral",
    "reading": "3-4 sentences on how the Fire Horse year of 2026 sits with their sign — what themes, opportunities, and cautions this year carries for them specifically. Grounded and specific, not generic horoscope language."
  }
}
Return only the JSON, no markdown. Write all text values as plain prose — no asterisks, no bold, no italics, no markdown formatting of any kind inside the strings.`,

    spirituality: `${personalization}

You are a scholar of comparative religion and spirituality, deeply versed in world traditions. A person has answered 9 questions about their spiritual orientation, including how they self-identify religiously.

Their answers:
${JSON.stringify((data as Record<string, unknown>).answers, null, 2)}

Based on their answers, identify 2-4 spiritual traditions or practices that resonate with their worldview. Do NOT pigeonhole them into one tradition — draw from multiple traditions that reflect their answers. Be inclusive of traditions from: Buddhism, Taoism, Sufism, Indigenous/earth-based spiritualities, Stoicism, Existentialism, Hinduism, Christianity (mystical/contemplative), Judaism (Kabbalah/Reform), Islam, Secular Humanism, Animism, Paganism, and others. If they self-identified with a specific religious tradition ("religious_identity"), honor that as a strong signal and make sure it (or its closer denomination/school, if their other answers suggest one) is reflected in the traditions returned — but still surface any other resonant traditions their answers reveal, since spiritual practice often extends beyond a single religious label.

Return a JSON object:
{
  "traditions": ["2-4 tradition names that resonate, e.g. 'Zen Buddhism', 'Stoicism', 'Taoist Philosophy'"],
  "themes": ["4-6 core spiritual themes that emerged, e.g. 'Presence', 'Interconnection', 'Service'"],
  "summary": "3-4 sentences describing their spiritual landscape in warm, pluralistic, non-dogmatic terms. Emphasize what these traditions share for them, not their differences."
}
Return only the JSON, no markdown. Write all text values as plain prose — no asterisks, no bold, no italics, no markdown formatting of any kind inside the strings.`,

    tarot: `${personalization}

You are a wise, compassionate tarot reader. A person set an intention and drew three cards.

Their intention: "${(data as Record<string, unknown>).intention}"
Cards drawn:
${JSON.stringify((data as Record<string, unknown>).cards, null, 2)}

Provide an interpretation of their reading. For each card, give a brief meaning in the context of their intention and position. Then offer a synthesis.

Return a JSON object:
{
  "cards": [
    { "name": "card name", "position": "Past/Present/Future", "reversed": boolean, "meaning": "2-3 sentences interpreting this card in this position for their specific intention" },
    ... (same for all 3)
  ],
  "summary": "3-4 sentences synthesizing the whole reading into a coherent message. Warm, grounded, non-predictive — frame as reflection, not fortune-telling.",
  "essence": "A short phrase (3-6 words) that captures the core message or feeling of this specific reading — evocative, not generic, e.g. 'Release control, trust the current'"
}
Return only the JSON, no markdown. Write all text values as plain prose — no asterisks, no bold, no italics, no markdown formatting of any kind inside the strings.`,

    values: `${personalization}

You are a values coach and depth psychologist. A person completed a values card sort: they sorted a broad set of values by how important each felt, narrowed their "very important" pile down to a ranked top 5, and wrote their own reflection on why each of those 5 matters to them.

Their top 5 values, in priority order: ${JSON.stringify((data as Record<string, unknown>).top_values)}
All values they marked "very important" (before narrowing to 5): ${JSON.stringify((data as Record<string, unknown>).very_important)}
Their own reflections, in their own words, on why each top value matters and what living it looks like:
${JSON.stringify((data as Record<string, unknown>).reflections, null, 2)}

Also select one single-sentence quote from real, published literature — a novel, poem, play, or classic essay, not a self-help book, not a movie, not song lyrics — that resonates with these values as a whole. This must be a genuine, accurately-worded quote from a well-known work that you are confident about. Prefer something widely known and frequently anthologized over something obscure, since accuracy matters far more than originality here — if you are not confident of the exact wording or attribution of a quote, choose a different, more famous one instead. Never invent a quote or misattribute one.

Return a JSON object:
{
  "top_values": ${JSON.stringify((data as Record<string, unknown>).top_values)},
  "summary": "3-4 sentences reflecting on what these values and their own reflections reveal about who this person is and what guides them. Draw on their reflections directly — echo specific language or themes from what they wrote rather than just restating the value names. Notice any tensions or beautiful contradictions. Warm, insightful, affirming.",
  "literary_quote": {
    "text": "The single-sentence quote, verbatim",
    "author": "The author's name",
    "work": "The title of the book, poem, or play it's from"
  }
}
Return only the JSON, no markdown. Write all text values as plain prose — no asterisks, no bold, no italics, no markdown formatting of any kind inside the strings.`,

    ikigai: `${personalization}

You are a life coach specializing in ikigai and purpose. A person has reflected on the four circles of their ikigai.

What they love: "${(data as Record<string, string>).love}"
What they're good at: "${(data as Record<string, string>).good_at}"
What the world needs: "${(data as Record<string, string>).world_needs}"
What they can be paid for: "${(data as Record<string, string>).paid_for}"

Synthesize their ikigai into a meaningful statement and identify key elements from each circle.

Return a JSON object:
{
  "love": ["3-5 single words (one word each, not phrases) distilled from what they love"],
  "good_at": ["3-5 single words (one word each, not phrases) distilled from what they're good at"],
  "world_needs": ["3-5 single words (one word each, not phrases) distilled from what the world needs"],
  "paid_for": ["3-5 single words (one word each, not phrases) distilled from what they can be paid for"],
  "ikigai_statement": "A single evocative sentence (15-25 words) that captures their unique reason for being. Should feel true and alive, not generic.",
  "essence": "A single word — one word only, no phrase — that captures or represents this person's ikigai. Evocative and specific to them, not generic (avoid just returning 'Ikigai' or 'Purpose'). Title case."
}
Return only the JSON, no markdown. Write all text values as plain prose — no asterisks, no bold, no italics, no markdown formatting of any kind inside the strings.`,
  }

  try {
    const prompt = prompts[factor]
    if (!prompt) return NextResponse.json({ error: 'Unknown factor' }, { status: 400 })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: factor === 'eastern_astrology' ? 2048 : 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const results = JSON.parse(text)
    return NextResponse.json({ results })
  } catch {
    // Fallback for development/when API key isn't set
    const fallback = STATIC_FALLBACKS[factor]
    if (fallback) return NextResponse.json(fallback(data as Record<string, unknown>, firstName))
    return NextResponse.json({ error: 'Failed to generate results' }, { status: 500 })
  }
}
