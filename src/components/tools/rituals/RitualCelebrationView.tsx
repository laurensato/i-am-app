'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import RitualSunriseIcon from '@/components/RitualSunriseIcon'
import { userTimezone } from '@/lib/journalReading'

type Props = {
  onClose: () => void
}

export default function RitualCelebrationView({ onClose }: Props) {
  const [mantra, setMantra] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setMantra(null)

    fetch('/api/daily-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone: userTimezone() }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load mantra')
        return res.json()
      })
      .then(data => {
        if (!cancelled) setMantra(data.mantra ?? 'I am enough, right now.')
      })
      .catch(() => {
        if (!cancelled) setMantra('I am enough, right now.')
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex flex-col items-center text-center px-2 py-4">
      <div className="ritual-celebration-rays pointer-events-none absolute inset-0 rounded-sm" aria-hidden />

      <motion.div
        className="relative mx-auto mb-5 flex justify-center"
        initial={{ opacity: 0, y: 16, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <RitualSunriseIcon size={88} variant="default" animated />
      </motion.div>

      <motion.h2
        className="relative text-xl font-normal mb-2"
        style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        You showed up for yourself
      </motion.h2>

      <motion.p
        className="relative text-sm font-light mb-6 max-w-sm"
        style={{ color: 'var(--text-muted)' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.5 }}
      >
        However the day unfolds, you moved through your ritual.
      </motion.p>

      <motion.div
        className="relative w-full px-4 py-5 border-t border-b mb-6"
        style={{
          borderColor: 'var(--parchment)',
          backgroundColor: 'color-mix(in srgb, var(--selected-bg) 28%, var(--warm-white))',
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36, duration: 0.5 }}
      >
        <p
          className="text-[10px] font-medium tracking-widest uppercase mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Today&apos;s Mantra
        </p>
        {mantra ? (
          <p
            className="text-lg italic font-light leading-relaxed"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
          >
            &ldquo;{mantra}&rdquo;
          </p>
        ) : (
          <div
            className="mx-auto h-5 w-3/4 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--parchment)' }}
          />
        )}
      </motion.div>

      <motion.button
        type="button"
        onClick={onClose}
        className="relative w-full max-w-xs py-2.5 text-xs font-medium tracking-wide uppercase transition-opacity hover:opacity-85"
        style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-text)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.44, duration: 0.4 }}
      >
        Return to my ritual
      </motion.button>
    </div>
  )
}
