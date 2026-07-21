'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MoonStars, YinYang, Flame, Cards, Diamond, Crosshair, Sparkle } from '@phosphor-icons/react'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, var(--cream) 0%, var(--parchment) 50%, var(--cream) 100%)' }}>

      <div className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-10 float"
        style={{ background: 'radial-gradient(circle, var(--terracotta), transparent)', animationDelay: '0s' }} />
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full opacity-10 float"
        style={{ background: 'radial-gradient(circle, var(--sage), transparent)', animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/4 w-40 h-40 rounded-full opacity-5 float"
        style={{ background: 'radial-gradient(circle, var(--gold), transparent)', animationDelay: '1s' }} />

      <motion.div
        className="text-center max-w-lg relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.div
          className="mb-6 float inline-block"
          style={{ color: 'var(--text-primary)' }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Sparkle size={64} weight="thin" />
        </motion.div>

        <h1 className="text-7xl font-bold mb-4 tracking-wider"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
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
              className="w-full py-4 px-8 rounded-2xl text-white font-medium text-lg transition-all"
              style={{ background: 'linear-gradient(135deg, var(--terracotta), var(--rust))' }}
              whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(196, 113, 74, 0.4)' }}
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
