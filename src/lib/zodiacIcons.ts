import type { Icon as IconComponent } from '@icon-park/react/es/runtime'
import {
  MouseZodiac, CattleZodiac, TigerZodiac, RabbitZodiac, DragonZodiac, SnakeZodiac,
  HorseZodiac, SheepZodiac, MonkeyZodiac, ChickenZodiac, DogZodiac, PigZodiac,
  Tree, Fire, Mountain, Magnet, Water,
} from '@icon-park/react'

const ANIMAL_ICONS: Record<string, IconComponent> = {
  rat: MouseZodiac, mouse: MouseZodiac,
  ox: CattleZodiac, cattle: CattleZodiac, buffalo: CattleZodiac, cow: CattleZodiac,
  tiger: TigerZodiac,
  rabbit: RabbitZodiac, hare: RabbitZodiac,
  dragon: DragonZodiac,
  snake: SnakeZodiac, serpent: SnakeZodiac,
  horse: HorseZodiac,
  goat: SheepZodiac, sheep: SheepZodiac, ram: SheepZodiac,
  monkey: MonkeyZodiac,
  rooster: ChickenZodiac, chicken: ChickenZodiac, cockerel: ChickenZodiac,
  dog: DogZodiac,
  pig: PigZodiac, boar: PigZodiac,
}

const ELEMENT_ICONS: Record<string, IconComponent> = {
  wood: Tree,
  fire: Fire,
  earth: Mountain,
  metal: Magnet,
  water: Water,
}

export function getZodiacAnimalIcon(animal?: string): IconComponent | null {
  if (!animal) return null
  return ANIMAL_ICONS[animal.trim().toLowerCase()] ?? null
}

export function getZodiacElementIcon(element?: string): IconComponent | null {
  if (!element) return null
  return ELEMENT_ICONS[element.trim().toLowerCase()] ?? null
}
