'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from '@phosphor-icons/react'

type BreathworkToolFocusShellProps = {
  focused: boolean
  onClose?: () => void
  placeholderMinHeight?: number
  children: React.ReactNode
}

export default function BreathworkToolFocusShell({
  focused,
  onClose,
  placeholderMinHeight = 280,
  children,
}: BreathworkToolFocusShellProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!focused) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [focused])

  return (
    <>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {focused && (
              <motion.div
                key="breathwork-focus-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="fixed inset-0 z-40"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--text-primary) 52%, transparent)',
                }}
                aria-hidden
              />
            )}
          </AnimatePresence>,
          document.body
        )}

      <div
        className={
          focused
            ? 'fixed inset-x-0 top-1/2 z-50 w-full -translate-y-1/2 px-6'
            : 'h-full'
        }
      >
        <motion.div
          layout
          transition={{ layout: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
          className={focused ? 'relative mx-auto w-full max-w-2xl' : 'h-full'}
        >
          {focused && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 z-10 flex items-center justify-center rounded-full p-1.5 transition-opacity hover:opacity-70"
              style={{
                color: 'var(--text-muted)',
                backgroundColor: 'color-mix(in srgb, var(--warm-white) 85%, transparent)',
              }}
              aria-label="Close"
            >
              <X size={16} weight="regular" />
            </button>
          )}
          {children}
        </motion.div>
      </div>

      {focused && (
        <div
          aria-hidden
          className="invisible pointer-events-none"
          style={{ minHeight: placeholderMinHeight }}
        />
      )}
    </>
  )
}
