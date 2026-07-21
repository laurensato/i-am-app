'use client'
import { MoonStars, YinYang, Flame, Cards, Diamond, Crosshair } from '@phosphor-icons/react'
import { FactorType } from '@/lib/types'

const ICONS: Record<FactorType, React.ComponentType<{ size?: number; weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'; color?: string }>> = {
  western_astrology: MoonStars,
  eastern_astrology: YinYang,
  spirituality: Flame,
  tarot: Cards,
  values: Diamond,
  ikigai: Crosshair,
}

interface Props {
  factor: FactorType
  size?: number
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
  color?: string
}

export default function FactorIcon({ factor, size = 32, weight = 'thin', color }: Props) {
  const Icon = ICONS[factor]
  return <Icon size={size} weight={weight} color={color} />
}
