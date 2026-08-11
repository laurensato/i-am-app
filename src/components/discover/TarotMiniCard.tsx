import Image from 'next/image'
import { Sparkle } from '@phosphor-icons/react'
import { getTarotCardImage } from '@/lib/tarotImages'

type Props = {
  name?: string
  reversed?: boolean
  width?: number
  height?: number
  alt?: string
}

export function TarotCardBack({ width = 40, height = 71, alt = 'Tarot card back' }: { width?: number; height?: number; alt?: string }) {
  return (
    <div
      className="relative rounded-md overflow-hidden shrink-0 flex items-center justify-center"
      style={{
        width,
        height,
        backgroundColor: 'var(--sol-navy)',
        border: '1px solid rgba(255,255,255,0.15)',
      }}
      aria-label={alt}
    >
      <Sparkle size={Math.max(14, width * 0.35)} weight="thin" color="rgba(255,255,255,0.4)" />
    </div>
  )
}

export default function TarotMiniCard({ name, reversed, width = 40, height = 71, alt }: Props) {
  if (!name) return <TarotCardBack width={width} height={height} alt={alt ?? 'Tarot card back'} />

  const img = getTarotCardImage(name)
  if (!img) {
    return (
      <div
        className="relative rounded-md overflow-hidden shrink-0 flex items-center justify-center px-1"
        style={{ width, height, backgroundColor: 'var(--parchment)' }}
        title={name}
      >
        <span className="text-[8px] text-center leading-tight" style={{ color: 'var(--text-secondary)' }}>{name}</span>
      </div>
    )
  }

  return (
    <div className="relative shrink-0" style={{ width, height }} title={name}>
      <Image
        src={img}
        alt={alt ?? name}
        fill
        sizes={`${width}px`}
        className="object-contain"
        style={{ transform: reversed ? 'rotate(180deg)' : 'none' }}
      />
    </div>
  )
}
