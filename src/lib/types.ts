export type FactorType =
  | 'western_astrology'
  | 'eastern_astrology'
  | 'spirituality'
  | 'tarot'
  | 'values'
  | 'ikigai'

export interface UserProfile {
  id: string
  user_id: string
  first_name: string
  age: number
  gender: string
  selected_factors: FactorType[]
  created_at: string
}

export interface IdentityFactor {
  id: string
  user_id: string
  factor_type: FactorType
  discovery_completed: boolean
  discovery_data: Record<string, unknown>
  results: FactorResults
  created_at: string
}

export interface WesternAstrologyResults {
  sun_sign: string
  moon_sign: string
  rising_sign: string
  summary: string
}

export interface EasternAstrologyResults {
  animal: string
  element: string
  yin_yang: string
  summary: string
}

export interface SpiritualityResults {
  traditions: string[]
  themes: string[]
  summary: string
}

export interface TarotResults {
  cards: { name: string; position: string; meaning: string; reversed: boolean }[]
  summary: string
}

export interface ValuesResults {
  top_values: string[]
  summary: string
}

export interface IkigaiResults {
  love: string[]
  good_at: string[]
  world_needs: string[]
  paid_for: string[]
  ikigai_statement: string
}

export type FactorResults =
  | WesternAstrologyResults
  | EasternAstrologyResults
  | SpiritualityResults
  | TarotResults
  | ValuesResults
  | IkigaiResults
  | Record<string, never>

export interface DailyMessage {
  insight: string
  mantra: string
  factor_snapshots: Record<FactorType, string>
}

export const FACTOR_META: Record<FactorType, { label: string; emoji: string; time: string; description: string }> = {
  western_astrology: {
    label: 'Western Astrology',
    emoji: '♑',
    time: '5 minutes',
    description: 'Discover how the stars at your birth shape your nature.',
  },
  eastern_astrology: {
    label: 'Eastern Astrology',
    emoji: '🐉',
    time: '2 minutes',
    description: 'Explore the ancient wisdom of your Chinese zodiac sign.',
  },
  spirituality: {
    label: 'Spirituality',
    emoji: '🕯️',
    time: '10 minutes',
    description: 'Find the wisdom traditions that resonate with your soul.',
  },
  tarot: {
    label: 'Tarot',
    emoji: '🃏',
    time: '5 minutes',
    description: 'Draw cards to illuminate your past, present, and future.',
  },
  values: {
    label: 'Values',
    emoji: '💎',
    time: '15 minutes',
    description: 'Uncover the core values that guide your deepest choices.',
  },
  ikigai: {
    label: 'Ikigai',
    emoji: '⊙',
    time: '20 minutes',
    description: 'Find your reason for being at the intersection of love, skill, need, and vocation.',
  },
}
