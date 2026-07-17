import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, dangerouslyAllowBrowser: true })

const STATIC_FALLBACKS: Record<string, (data: Record<string, unknown>) => unknown> = {
  western_astrology: (data) => {
    const d = data as { birthDate?: string; birthPlace?: string }
    return {
      results: {
        sun_sign: 'Scorpio',
        moon_sign: 'Cancer',
        rising_sign: 'Libra',
        summary: `Based on your birth data, your Sun is in Scorpio — deep, transformative, and intensely perceptive. Your Moon in Cancer speaks to a rich inner life and deep emotional intelligence. Your Libra rising presents a graceful, diplomatic face to the world, seeking harmony in all things.`,
      }
    }
  },
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { factor, data } = await req.json()

  const prompts: Record<string, string> = {
    western_astrology: `You are an expert Western astrologer. Given birth data, calculate and interpret the natal chart.

Birth Date: ${(data as Record<string, string>).birthDate}
Birth Time: ${(data as Record<string, string>).birthTime || 'unknown'}
Birth Place: ${(data as Record<string, string>).birthPlace}

Calculate the Sun sign, Moon sign, and Rising sign (use noon if time is unknown — estimate rising as same as sun in that case, and note that). Return a JSON object with this exact structure:
{
  "sun_sign": "Sign name",
  "moon_sign": "Sign name",
  "rising_sign": "Sign name (or 'Unknown — birth time needed')",
  "summary": "2-3 sentences weaving together these three aspects into a portrait of this person's cosmic nature. Warm, insightful, non-judgmental."
}
Return only the JSON, no markdown.`,

    eastern_astrology: `You are an expert in Chinese astrology. Given a birth year and month, determine the Chinese zodiac sign.

Birth Year: ${(data as Record<string, string>).birthYear}
Birth Month: ${(data as Record<string, string>).birthMonth}

Note: The Chinese New Year falls between Jan 21 and Feb 20. If born in January or early February, they may belong to the previous year's animal. Calculate correctly.

Return a JSON object:
{
  "animal": "Animal name",
  "element": "Element (Wood/Fire/Earth/Metal/Water)",
  "yin_yang": "Yin or Yang",
  "summary": "2-3 sentences describing the nature, strengths, and wisdom of this sign and element combination. Warm and affirming."
}
Return only the JSON, no markdown.`,

    spirituality: `You are a scholar of comparative religion and spirituality, deeply versed in world traditions. A person has answered 8 questions about their spiritual orientation.

Their answers:
${JSON.stringify((data as Record<string, unknown>).answers, null, 2)}

Based on their answers, identify 2-4 spiritual traditions or practices that resonate with their worldview. Do NOT pigeonhole them into one tradition — draw from multiple traditions that reflect their answers. Be inclusive of traditions from: Buddhism, Taoism, Sufism, Indigenous/earth-based spiritualities, Stoicism, Existentialism, Hinduism, Christianity (mystical/contemplative), Judaism (Kabbalah/Reform), Islam, Secular Humanism, Animism, Paganism, and others.

Return a JSON object:
{
  "traditions": ["2-4 tradition names that resonate, e.g. 'Zen Buddhism', 'Stoicism', 'Taoist Philosophy'"],
  "themes": ["4-6 core spiritual themes that emerged, e.g. 'Presence', 'Interconnection', 'Service'"],
  "summary": "3-4 sentences describing their spiritual landscape in warm, pluralistic, non-dogmatic terms. Emphasize what these traditions share for them, not their differences."
}
Return only the JSON, no markdown.`,

    tarot: `You are a wise, compassionate tarot reader. A person set an intention and drew three cards.

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
  "summary": "3-4 sentences synthesizing the whole reading into a coherent message. Warm, grounded, non-predictive — frame as reflection, not fortune-telling."
}
Return only the JSON, no markdown.`,

    values: `You are a values coach and depth psychologist. A person has identified and ranked their core values.

Their values in order: ${JSON.stringify((data as Record<string, unknown>).top_values)}
All selected values: ${JSON.stringify((data as Record<string, unknown>).all_selected)}

Return a JSON object:
{
  "top_values": ${JSON.stringify((data as Record<string, unknown>).top_values)},
  "summary": "3-4 sentences reflecting on what these values reveal about who this person is and what guides them. Notice any tensions or beautiful contradictions. Warm, insightful, affirming."
}
Return only the JSON, no markdown.`,

    ikigai: `You are a life coach specializing in ikigai and purpose. A person has reflected on the four circles of their ikigai.

What they love: "${(data as Record<string, string>).love}"
What they're good at: "${(data as Record<string, string>).good_at}"
What the world needs: "${(data as Record<string, string>).world_needs}"
What they can be paid for: "${(data as Record<string, string>).paid_for}"

Synthesize their ikigai into a meaningful statement and identify key elements from each circle.

Return a JSON object:
{
  "love": ["3-5 key phrases extracted from what they love"],
  "good_at": ["3-5 key phrases from what they're good at"],
  "world_needs": ["3-5 key phrases from what the world needs"],
  "paid_for": ["3-5 key phrases from what they can be paid for"],
  "ikigai_statement": "A single evocative sentence (15-25 words) that captures their unique reason for being. Should feel true and alive, not generic."
}
Return only the JSON, no markdown.`,
  }

  try {
    const prompt = prompts[factor]
    if (!prompt) return NextResponse.json({ error: 'Unknown factor' }, { status: 400 })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const results = JSON.parse(text)
    return NextResponse.json({ results })
  } catch {
    // Fallback for development/when API key isn't set
    const fallback = STATIC_FALLBACKS[factor]
    if (fallback) return NextResponse.json(fallback(data as Record<string, unknown>))
    return NextResponse.json({ error: 'Failed to generate results' }, { status: 500 })
  }
}
