'use client'
import { motion } from 'framer-motion'
import { Sparkle } from '@phosphor-icons/react'

interface Props {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
}

export default function SubmitButton({ onClick, loading, disabled, children }: Props) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-4 rounded-xl text-white font-medium text-base disabled:opacity-50 mt-2"
      style={{ background: 'linear-gradient(135deg, var(--terracotta), var(--rust))' }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Sparkle size={16} weight="thin" className="animate-spin" /> Working...
        </span>
      ) : children}
    </motion.button>
  )
}
