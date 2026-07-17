'use client'
import { motion } from 'framer-motion'

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
      {loading ? '✦ Working...' : children}
    </motion.button>
  )
}
