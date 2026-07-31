'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MoonStars, YinYang, Flame, Cards, Diamond, Crosshair } from '@phosphor-icons/react'
import Logo from '@/components/Logo'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: 'var(--cream)' }}>

      <motion.div
        className="text-center max-w-lg relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.div
          className="mb-6 inline-block"
          style={{ color: 'var(--text-primary)' }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Logo size={64} variant="lines" />
        </motion.div>

        <h1 className="text-6xl font-medium mb-4"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', letterSpacing: '0.24em', textIndent: '0.24em' }}>
          I AM
        </h1>

        <p className="text-xl mb-3 font-light" style={{ color: 'var(--text-secondary)' }}>
          Discover who you are becoming.
        </p>

        <p className="text-base mb-12 leading-relaxed font-light" style={{ color: 'var(--text-muted)' }}>
          A personal journey through astrology, spirituality, values, and meaning —
          with daily insights to guide your way.
        </p>

        <div className="flex flex-col gap-4">
          <Link href="/auth?mode=signup">
            <motion.button
              className="w-full py-4 px-8 font-medium text-lg transition-all"
              style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-text)' }}
              whileHover={{ opacity: 0.85 }}
              whileTap={{ scale: 0.98 }}
            >
              Begin Your Journey
            </motion.button>
          </Link>

          <Link href="/auth?mode=signin">
            <button className="w-full py-3 px-8 text-base font-light transition-colors"
              style={{ color: 'var(--text-muted)' }}>
              Already on the path? Sign in
            </button>
          </Link>
        </div>

        <div className="mt-16 flex justify-center gap-8 opacity-25" style={{ color: 'var(--text-secondary)' }}>
          <MoonStars size={24} weight="thin" />
          <YinYang size={24} weight="thin" />
          <Flame size={24} weight="thin" />
          <Cards size={24} weight="thin" />
          <Diamond size={24} weight="thin" />
          <Crosshair size={24} weight="thin" />
        </div>
      </motion.div>
    </main>
  )
}
