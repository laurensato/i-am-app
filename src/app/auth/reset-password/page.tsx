'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: 'var(--cream)' }}>
      <motion.div
        className="w-full max-w-sm p-8"
        style={{ backgroundColor: 'var(--warm-white)', border: '1px solid var(--parchment)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center" style={{ color: 'var(--text-primary)' }}><Logo size={56} variant="lines" /></div>
          <h1 className="text-4xl font-normal mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', letterSpacing: '0.24em', textIndent: '0.24em' }}>
            I AM
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Set a new password</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 border text-base outline-none transition-all"
            style={{
              borderColor: 'var(--parchment)',
              backgroundColor: 'var(--warm-white)',
              color: 'var(--text-primary)',
            }}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 border text-base outline-none transition-all"
            style={{
              borderColor: 'var(--parchment)',
              backgroundColor: 'var(--warm-white)',
              color: 'var(--text-primary)',
            }}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-4 font-medium text-base mt-2 disabled:opacity-60"
            style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-text)' }}
            whileHover={{ opacity: 0.85 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? '...' : 'Update password'}
          </motion.button>
        </form>
      </motion.div>
    </main>
  )
}
