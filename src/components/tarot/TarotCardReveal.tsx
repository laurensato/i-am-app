'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Sparkle } from '@phosphor-icons/react'
import { getTarotCardImage } from '@/lib/tarotImages'

export type TarotRevealCard = {
  name: string
  position: string
  reversed?: boolean
}

type Props = {
  cards: TarotRevealCard[]
  revealed: Set<number>
  onReveal: (index: number) => void
  compact?: boolean
  showLabels?: boolean
}

export default function TarotCardReveal({
  cards,
  revealed,
  onReveal,
  compact = false,
  showLabels = true,
}: Props) {
  const width = compact ? 72 : 96
  const height = compact ? 126 : 168

  return (
    <div className={`flex justify-center flex-wrap${compact ? ' gap-3' : ' gap-4'}`}>
      {cards.map((card, index) => {
        const isRevealed = revealed.has(index)
        const img = getTarotCardImage(card.name)

        return (
          <div key={`${card.position}-${index}`} className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!isRevealed) onReveal(index)
              }}
              aria-label={isRevealed ? card.name : `Reveal ${card.position || 'card'}`}
              className="rounded-xl overflow-hidden"
              style={{
                width,
                height,
                perspective: 800,
                cursor: isRevealed ? 'default' : 'pointer',
              }}
            >
              <motion.div
                className="relative w-full h-full"
                style={{ transformStyle: 'preserve-3d', pointerEvents: 'none' }}
                animate={{ rotateY: isRevealed ? 180 : 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                whileHover={!isRevealed ? { scale: 1.04 } : undefined}
                whileTap={!isRevealed ? { scale: 0.97 } : undefined}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-xl"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    backgroundColor: 'var(--sol-navy)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <Sparkle size={compact ? 20 : 28} weight="thin" color="rgba(255,255,255,0.4)" />
                </div>

                <div
                  className="absolute inset-0 rounded-xl overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {img ? (
                    <Image
                      src={img}
                      alt={card.name}
                      fill
                      sizes={`${width}px`}
                      className="object-contain"
                      style={{ transform: card.reversed ? 'rotate(180deg)' : 'none' }}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-center p-2"
                      style={{ backgroundColor: 'var(--parchment)' }}
                    >
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {card.name}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </button>

            {showLabels && (
              <div className="text-center">
                <p
                  className="text-[10px] uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {card.position}
                </p>
                {isRevealed && (
                  <p
                    className="text-xs font-normal mt-0.5"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
                  >
                    {card.name}
                    {card.reversed ? ' (Reversed)' : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
