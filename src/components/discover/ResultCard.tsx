'use client'
import { motion } from 'framer-motion'
import { ArrowLeft } from '@phosphor-icons/react'
import Logo from '@/components/Logo'

interface Props {
  title: string
  children: React.ReactNode
  onContinue: () => void
}

export default function ResultCard({ title, children, onContinue }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6">
      <div className="text-center">
        <div className="mb-3 inline-block" style={{ color: 'var(--text-muted)' }}>
          <Logo size={40} variant="lines" />
        </div>
        <h2 className="text-2xl font-normal" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          {title}
        </h2>
      </div>

      <div className="p-6"
        style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
        {children}
      </div>

      <motion.button
        onClick={onContinue}
        className="w-full py-4 font-medium text-base"
        style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-text)' }}
        whileHover={{ opacity: 0.85 }}
        whileTap={{ scale: 0.98 }}>
        <span className="flex items-center justify-center gap-2"><ArrowLeft size={16} weight="regular" /> Return to Dashboard</span>
      </motion.button>
    </motion.div>
  )
}
