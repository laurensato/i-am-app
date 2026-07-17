'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { FactorType, FACTOR_META } from '@/lib/types'

const GENDER_OPTIONS = [
  'Woman', 'Man', 'Non-binary', 'Genderqueer', 'Genderfluid',
  'Agender', 'Two-Spirit', 'Trans woman', 'Trans man', 'Prefer not to say', 'Self-describe'
]

const FACTORS: FactorType[] = ['western_astrology', 'eastern_astrology', 'spirituality', 'tarot', 'values', 'ikigai']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [firstName, setFirstName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [customGender, setCustomGender] = useState('')
  const [selectedFactors, setSelectedFactors] = useState<FactorType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  function toggleFactor(f: FactorType) {
    setSelectedFactors(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    )
  }

  async function handleFinish() {
    if (selectedFactors.length === 0) { setError('Please select at least one identity factor.'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const finalGender = gender === 'Self-describe' ? customGender : gender

    const { error: profileError } = await supabase.from('profiles').upsert({
      user_id: user.id,
      first_name: firstName,
      age: parseInt(age),
      gender: finalGender,
      selected_factors: selectedFactors,
    })

    if (profileError) { setError(profileError.message); setLoading(false); return }

    // Create placeholder factor rows
    await supabase.from('identity_factors').upsert(
      selectedFactors.map(f => ({
        user_id: user.id,
        factor_type: f,
        discovery_completed: false,
        discovery_data: {},
        results: {},
      }))
    )

    router.push('/dashboard')
  }

  const steps = [
    // Step 0: name
    <motion.div key="name" className="flex flex-col gap-6"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
      <div>
        <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          What shall we call you?
        </h2>
        <p className="text-base font-light" style={{ color: 'var(--text-muted)' }}>
          This journey is yours. Let&apos;s start with your name.
        </p>
      </div>
      <input
        type="text"
        placeholder="First name"
        value={firstName}
        onChange={e => setFirstName(e.target.value)}
        className="w-full px-4 py-4 rounded-xl border text-xl outline-none"
        style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)', color: 'var(--text-primary)' }}
        autoFocus
      />
      <NavButtons
        onNext={() => setStep(1)}
        nextDisabled={!firstName.trim()}
        showBack={false}
      />
    </motion.div>,

    // Step 1: age + gender
    <motion.div key="age-gender" className="flex flex-col gap-6"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
      <div>
        <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          A little about you, {firstName}
        </h2>
        <p className="text-base font-light" style={{ color: 'var(--text-muted)' }}>
          This helps personalize your daily insights.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Age</label>
        <input
          type="number"
          min="18"
          max="120"
          placeholder="Your age"
          value={age}
          onChange={e => setAge(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border text-base outline-none"
          style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)', color: 'var(--text-primary)' }}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Gender</label>
        <div className="flex flex-wrap gap-2">
          {GENDER_OPTIONS.map(g => (
            <button key={g} onClick={() => setGender(g)}
              className="px-3 py-2 rounded-full text-sm border transition-all"
              style={{
                borderColor: gender === g ? 'var(--terracotta)' : 'var(--parchment)',
                backgroundColor: gender === g ? 'var(--terracotta)' : 'var(--warm-white)',
                color: gender === g ? 'white' : 'var(--text-secondary)',
              }}>
              {g}
            </button>
          ))}
        </div>
        {gender === 'Self-describe' && (
          <input
            type="text"
            placeholder="Describe your gender"
            value={customGender}
            onChange={e => setCustomGender(e.target.value)}
            className="mt-3 w-full px-4 py-3 rounded-xl border text-base outline-none"
            style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)', color: 'var(--text-primary)' }}
          />
        )}
      </div>

      <NavButtons
        onBack={() => setStep(0)}
        onNext={() => setStep(2)}
        nextDisabled={!age || !gender || (gender === 'Self-describe' && !customGender)}
      />
    </motion.div>,

    // Step 2: identity factors
    <motion.div key="factors" className="flex flex-col gap-6"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
      <div>
        <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
          What do you want to discover?
        </h2>
        <p className="text-base font-light" style={{ color: 'var(--text-muted)' }}>
          Choose the lenses through which you&apos;d like to know yourself. You can add more later.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {FACTORS.map(f => {
          const meta = FACTOR_META[f]
          const selected = selectedFactors.includes(f)
          return (
            <motion.button
              key={f}
              onClick={() => toggleFactor(f)}
              className="flex items-center gap-4 p-4 rounded-2xl border text-left transition-all"
              style={{
                borderColor: selected ? 'var(--terracotta)' : 'var(--parchment)',
                backgroundColor: selected ? 'rgba(196,113,74,0.08)' : 'var(--warm-white)',
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <span className="text-3xl">{meta.emoji}</span>
              <div>
                <div className="font-medium text-base" style={{ color: 'var(--text-primary)' }}>{meta.label}</div>
                <div className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>{meta.description}</div>
              </div>
              {selected && <span className="ml-auto text-xl" style={{ color: 'var(--terracotta)' }}>✓</span>}
            </motion.button>
          )
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <NavButtons
        onBack={() => setStep(1)}
        onNext={handleFinish}
        nextLabel={loading ? 'Setting up...' : 'Enter Your Dashboard'}
        nextDisabled={loading}
      />
    </motion.div>,
  ]

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ backgroundColor: 'var(--cream)' }}>
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex gap-2 justify-center mb-10">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full transition-all"
              style={{ backgroundColor: i === step ? 'var(--terracotta)' : 'var(--parchment)', width: i === step ? '24px' : '8px' }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {steps[step]}
        </AnimatePresence>
      </div>
    </main>
  )
}

function NavButtons({
  onBack, onNext, nextLabel = 'Continue', nextDisabled = false, showBack = true
}: {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
  showBack?: boolean
}) {
  return (
    <div className="flex gap-3 mt-2">
      {showBack && onBack && (
        <button onClick={onBack}
          className="px-6 py-3 rounded-xl border font-light text-base transition-all"
          style={{ borderColor: 'var(--parchment)', color: 'var(--text-muted)' }}>
          Back
        </button>
      )}
      <motion.button
        onClick={onNext}
        disabled={nextDisabled}
        className="flex-1 py-3 rounded-xl text-white font-medium text-base disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, var(--terracotta), var(--rust))' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {nextLabel}
      </motion.button>
    </div>
  )
}
