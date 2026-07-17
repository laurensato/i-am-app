'use client'
import { motion } from 'framer-motion'

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
        <div className="text-4xl mb-3 float inline-block">✦</div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          {title}
        </h2>
      </div>

      <div className="p-6 rounded-2xl card-shadow"
        style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}>
        {children}
      </div>

      <motion.button
        onClick={onContinue}
        className="w-full py-4 rounded-xl text-white font-medium text-base"
        style={{ background: 'linear-gradient(135deg, var(--terracotta), var(--rust))' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}>
        Return to Dashboard →
      </motion.button>
    </motion.div>
  )
}
