import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, dangerouslyAllowBrowser: true })

const FACTOR_PERSONAS: Record<string, string> = {
  western_astrology: 'You are an expert, warm Western astrologer.',
  eastern_astrology: 'You are an expert, warm Chinese astrology guide.',
  spirituality: 'You are a scholar of comparative religion and spirituality, warm and pluralistic.',
  tarot: 'You are a wise, compassionate tarot reader.',
  values: 'You are a values coach and depth psychologist.',
  ikigai: 'You are a life coach specializing in ikigai and purpose.',
}

function buildContext(factor: string, results: Record<string, unknown>): string {
  switch (factor) {
    case 'western_astrology': {
      const r = results as { sun_sign?: string; moon_sign?: string; rising_sign?: string; summary?: string }
      return `Sun sign: ${r.sun_sign}\nMoon sign: ${r.moon_sign}\nRising sign: ${r.rising_sign}\nReading: ${r.summary}`
    }
    case 'eastern_astrology': {
      const r = results as { animal?: string; element?: string; yin_yang?: string; summary?: string }
      return `Animal: ${r.animal}\nElement: ${r.element}\nYin/Yang: ${r.yin_yang}\nReading: ${r.summary}`
    }
    case 'spirituality': {
      const r = results as { traditions?: string[]; themes?: string[]; summary?: string }
      return `Resonant traditions: ${(r.traditions ?? []).join(', ')}\nCore themes: ${(r.themes ?? []).join(', ')}\nReading: ${r.summary}`
    }
    case 'tarot': {
      const r = results as { cards?: { name: string; position: string; reversed?: boolean; meaning?: string }[]; summary?: string }
      const cardsText = (r.cards ?? []).map(c => `${c.position}: ${c.name}${c.reversed ? ' (Reversed)' : ''} — ${c.meaning ?? ''}`).join('\n')
      return `Cards drawn:\n${cardsText}\nReading: ${r.summary}`
    }
    case 'values': {
      const r = results as { top_values?: string[]; reflections?: Record<string, string>; summary?: string }
      const reflectionsText = Object.entries(r.reflections ?? {}).map(([v, text]) => `${v}: "${text}"`).join('\n')
      return `Top values, in order: ${(r.top_values ?? []).join(', ')}\nTheir own reflections:\n${reflectionsText}\nReading: ${r.summary}`
    }
    case 'ikigai': {
      const r = results as { love?: string[]; good_at?: string[]; world_needs?: string[]; paid_for?: string[]; ikigai_statement?: string }
      return `What they love: ${(r.love ?? []).join(', ')}\nWhat they're good at: ${(r.good_at ?? []).join(', ')}\nWhat the world needs: ${(r.world_needs ?? []).join(', ')}\nWhat they can be paid for: ${(r.paid_for ?? []).join(', ')}\nIkigai statement: ${r.ikigai_statement}`
    }
    default:
      return JSON.stringify(results)
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { factor, results, profile, question, history } = await req.json()
  if (!question || typeof question !== 'string') {
    return NextResponse.json({ error: 'Missing question' }, { status: 400 })
  }

  const persona = FACTOR_PERSONAS[factor] ?? 'You are a warm, insightful personal guide.'
  const context = buildContext(factor, (results ?? {}) as Record<string, unknown>)
  const firstName = (profile as { first_name?: string } | null)?.first_name?.trim()

  const system = `${persona} Someone is looking at a reading you gave them and has a follow-up question about it. Answer directly and conversationally, grounded specifically in the reading below — don't repeat the whole reading back to them, just answer what they actually asked. Keep answers focused, 2-5 sentences unless they clearly ask for more depth. Write in plain prose — no markdown, no asterisks, no bullet points.${firstName ? ` Their name is ${firstName} — you may use it occasionally, but don't force it into every reply.` : ''}

Their reading:
${context}`

  const priorMessages = (Array.isArray(history) ? history : [])
    .slice(-10)
    .filter((m: { role?: string; content?: string }) => m && typeof m.content === 'string')
    .map((m: { role?: string; content: string }) => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: m.content,
    }))

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system,
      messages: [...priorMessages, { role: 'user', content: question }],
    })
    const answer = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ answer })
  } catch {
    return NextResponse.json({ error: 'Failed to answer' }, { status: 500 })
  }
}
