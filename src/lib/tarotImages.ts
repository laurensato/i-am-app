import { getImagePath } from '@cometpisces/tarot-kit-images'

export function getTarotCardImage(cardName: string): string | undefined {
  const id = cardName.toLowerCase().replace(/\s+/g, '-')
  const filename = getImagePath(id)
  return filename ? `/tarot-cards/${filename}` : undefined
}
