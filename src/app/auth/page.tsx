'use client'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkle } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'

function AuthForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get('mode') ?? 'signin'
  const isSignup = mode === 'signup'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      setSent(true)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      router.push('/dashboard')
    }
    setLoading(false)
  }

  if (sent) return (
    <div className="text-center">
      <div className="text-5xl mb-6">✉️</div>
      <h2 className="text-2xl font-normal mb-3" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
        Check your email
      </h2>
      <p style={{ color: 'var(--text-muted)' }}>We sent a confirmation link to <strong>{email}</strong></p>
    </div>
  )

  return (
    <div>
      <div className="text-center mb-8">
        <div className="mb-4 flex justify-center" style={{ color: 'var(--text-secondary)' }}><Sparkle size={36} weight="thin" /></div>
        <h1 className="text-4xl font-normal mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          I AM
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>{isSignup ? 'Create your account' : 'Welcome back'}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border text-base outline-none transition-all"
          style={{
            borderColor: 'var(--parchment)',
            backgroundColor: 'var(--warm-white)',
            color: 'var(--text-primary)',
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-3 rounded-xl border text-base outline-none transition-all"
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
          className="w-full py-4 rounded-xl text-white font-medium text-base mt-2 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, var(--terracotta), var(--rust))' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? '...' : isSignup ? 'Create Account' : 'Sign In'}
        </motion.button>
      </form>

      <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
        {isSignup ? 'Already have an account? ' : "Don't have an account? "}
        <a href={isSignup ? '/auth?mode=signin' : '/auth?mode=signup'}
          className="underline" style={{ color: 'var(--terracotta)' }}>
          {isSignup ? 'Sign in' : 'Sign up'}
        </a>
      </p>
    </div>
  )
}

export default function AuthPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: 'var(--cream)' }}>
      <motion.div
        className="w-full max-w-sm p-8 rounded-3xl card-shadow"
        style={{ backgroundColor: 'var(--warm-white)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Suspense>
          <AuthForm />
        </Suspense>
      </motion.div>
    </main>
  )
}
