'use client'

import { AnimatePresence, motion } from 'framer-motion'
import RitualCelebrationView from '@/components/tools/rituals/RitualCelebrationView'

type Props = {
  open: boolean
  onClose: () => void
}

/** @deprecated Use RitualRunnerModal celebration phase instead */
export default function RitualCompletionCelebration({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-6 py-10"
          style={{ backgroundColor: 'color-mix(in srgb, var(--text-primary) 42%, transparent)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          role="dialog"
          aria-modal
        >
          <motion.div
            className="relative w-full max-w-md overflow-hidden px-8 py-10 border ritual-celebration-panel"
            style={{
              borderColor: 'color-mix(in srgb, var(--parchment) 70%, white)',
              backgroundColor: 'var(--warm-white)',
            }}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
          >
            <RitualCelebrationView onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
