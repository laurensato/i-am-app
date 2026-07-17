import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, dangerouslyAllowBrowser: true })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { factor, factorResults, profile: bodyProfile } = body

  const today = new Date().toISOString().split('T')[0]

  // If requesting a specific factor's daily content
  if (factor && factorResults) {
    const content = await generateFactorContent(factor, factorResults, bodyProfile)
    return NextResponse.json({ factor_content: content })
  }

  // Check if we already have today's daily message
  const { data: existing } = await supabase
    .from('daily_messages')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (existing) {
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

  const profileSummary = profile
    ? `Name: ${profile.first_name}, Age: ${profile.age}, Gender: ${profile.gender}`
    : 'Unknown'

  const factorSummary = (factors ?? []).map(f => {
    const r = f.results as Record<string, unknown>
    switch (f.factor_type) {
      case 'western_astrology': return `Western Astrology: Sun ${(r as {sun_sign?:string}).sun_sign}, Moon ${(r as {moon_sign?:string}).moon_sign}, Rising ${(r as {rising_sign?:string}).rising_sign}`
      case 'eastern_astrology': return `Eastern Astrology: ${(r as {element?:string}).element} ${(r as {animal?:string}).animal}`
      case 'spirituality': return `Spiritual traditions: ${((r as {traditions?:string[]}).traditions ?? []).join(', ')}`
      case 'tarot': return `Tarot cards drawn: ${((r as {cards?:{name:string}[]}).cards ?? []).map(c => c.name).join(', ')}`
      case 'values': return `Core values: ${((r as {top_values?:string[]}).top_values ?? []).join(', ')}`
      case 'ikigai': return `Ikigai: ${(r as {ikigai_statement?:string}).ikigai_statement}`
      default: return ''
    }
  }).filter(Boolean).join('\n')

  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  const prompt = `You are a wise, warm, and grounding personal guide for someone navigating a meaningful life transition — often called a "midlife" moment. They are discovering themselves through multiple lenses of identity.

Person: ${profileSummary}
Today: ${dayOfWeek}, ${dateStr}

What we know about them:
${factorSummary || 'They are just beginning their journey of self-discovery.'}

Generate a daily message for them. The insight should be 2-3 sentences — personal, reflective, and grounded in what we know about them. It should feel like it was written specifically for them, not generic.

The mantra should be 5-10 words that capture today's invitation to them. It should feel like something they could actually say to themselves.

Return JSON only:
{
  "insight": "2-3 sentence personal insight drawing on their identity factors and the day",
  "mantra": "short mantra for today"
}
No markdown, just JSON.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const { insight, mantra } = JSON.parse(text)

    await supabase.from('daily_messages').upsert({
      user_id: user.id,
      date: today,
      insight,
      mantra,
    })

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
    })

    return NextResponse.json(fallback)
  }
}

async function generateFactorContent(
  factor: string,
  results: Record<string, unknown>,
  profile: { first_name: string; age: number; gender: string } | null
): Promise<string> {
  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  const factorPrompts: Record<string, string> = {
    western_astrology: `You are an astrologer. Today is ${dayOfWeek}. Generate a personalized horoscope (3-4 sentences) for someone with:
Sun: ${(results as {sun_sign?:string}).sun_sign}, Moon: ${(results as {moon_sign?:string}).moon_sign}, Rising: ${(results as {rising_sign?:string}).rising_sign}
Make it reflective and grounded, not predictive. Focus on inner themes, not external events.`,

    eastern_astrology: `You are a Chinese astrology guide. Today is ${dayOfWeek}. Generate a personalized daily reflection (3-4 sentences) for a ${(results as {element?:string}).element} ${(results as {animal?:string}).animal}.
Draw on the energy and wisdom of their sign and element. Warm and grounding.`,

    spirituality: `You are a multi-tradition spiritual guide. Today is ${dayOfWeek}. This person resonates with: ${((results as {traditions?:string[]}).traditions ?? []).join(', ')}.
Their core spiritual themes: ${((results as {themes?:string[]}).themes ?? []).join(', ')}.
Offer a brief wisdom teaching (3-4 sentences) that weaves together insights from their resonant traditions. Inclusive and non-dogmatic.`,

    tarot: `You are a tarot reader. Today is ${dayOfWeek}. This person previously drew these cards:
${((results as {cards?:{name:string;position:string}[]}).cards ?? []).map(c => `${c.position}: ${c.name}`).join(', ')}
Offer a brief daily reflection (3-4 sentences) on how the energy of these cards might be showing up today in new ways. Reflective, not predictive.`,

    values: `You are a values coach. Today is ${dayOfWeek}. This person's core values are: ${((results as {top_values?:string[]}).top_values ?? []).join(', ')}.
Offer a brief daily reflection (3-4 sentences) that invites them to notice or practice one of their values today. Concrete and warm.`,

    ikigai: `You are an ikigai guide. Today is ${dayOfWeek}. This person's reason for being: "${(results as {ikigai_statement?:string}).ikigai_statement}".
Offer a brief daily reflection (3-4 sentences) that helps them live their ikigai today in a small, practical way. Grounding and encouraging.`,
  }

  const prompt = factorPrompts[factor]
  if (!prompt) return 'Today is an invitation to reflect on this aspect of yourself.'

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })
    return response.content[0].type === 'text' ? response.content[0].text : ''
  } catch {
    return 'Today is an invitation to sit with what you know about yourself through this lens.'
  }
}
