'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowCounterClockwise } from '@phosphor-icons/react'
import { FactorType, FACTOR_META, IdentityFactor } from '@/lib/types'
import FactorIcon from '@/components/FactorIcon'
import WesternAstrologyFlow from '@/components/discover/WesternAstrologyFlow'
import EasternAstrologyFlow from '@/components/discover/EasternAstrologyFlow'
import SpiritualityFlow from '@/components/discover/SpiritualityFlow'
import ValuesFlow from '@/components/discover/ValuesFlow'
import IkigaiFlow from '@/components/discover/IkigaiFlow'
import DailyView from '@/components/discover/DailyView'
import AskModal from '@/components/discover/AskModal'

interface Props {
  factor: FactorType
  factorRow: IdentityFactor
  profile: { first_name: string; age: number; gender: string } | null
  userId: string
}

export default function DiscoverClient({ factor, factorRow, profile, userId }: Props) {
  const router = useRouter()
  const meta = FACTOR_META[factor]
  const [updating, setUpdating] = useState(false)

  function onComplete() {
    setUpdating(false)
    router.push('/dashboard')
    router.refresh()
  }

  // Tarot has no intake — daily and weekly draws are the full experience
  if (factor === 'tarot') {
    return (
      <PageShell factor={factor}>
        <DailyView factor={factor} factorRow={factorRow} profile={profile} userId={userId} />
        <AskModal factor={factor} results={factorRow.results} profile={profile} />
      </PageShell>
    )
  }

  if (factorRow.discovery_completed && !updating) {
    return (
      <PageShell factor={factor}>
        <DailyView factor={factor} factorRow={factorRow} profile={profile} userId={userId} />
        <button onClick={() => setUpdating(true)}
          className="w-full mt-6 py-3 text-sm font-light text-center transition-colors"
          style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center justify-center gap-2">
            <ArrowCounterClockwise size={16} weight="regular" /> Update my intake
          </span>
        </button>
        <AskModal factor={factor} results={factorRow.results} profile={profile} />
      </PageShell>
    )
  }

  const Flow = {
    western_astrology: WesternAstrologyFlow,
    eastern_astrology: EasternAstrologyFlow,
    spirituality: SpiritualityFlow,
    values: ValuesFlow,
    ikigai: IkigaiFlow,
  }[factor]

  return (
    <PageShell factor={factor}>
      <div className="mb-8 p-6"
        style={{ backgroundColor: 'var(--selected-bg)', borderLeft: '3px solid var(--text-primary)' }}>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          {updating ? `Updating your ${meta.label}` : `⏱ Set aside ${meta.time}`}
        </p>
        <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
          {updating
            ? 'Your new answers will replace your current results once you finish.'
            : 'Find a quiet moment for yourself. This discovery is just for you.'}
        </p>
      </div>
      <Flow key={updating ? 'update' : 'initial'} factorRow={factorRow} profile={profile} userId={userId} onComplete={onComplete} />
    </PageShell>
  )
}

function PageShell({ factor, children }: { factor: FactorType; children: React.ReactNode }) {
  const meta = FACTOR_META[factor]
  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--cream)' }}>
      <header className="px-6 py-5 flex items-center gap-4 border-b"
        style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)' }}>
        <Link href="/dashboard" className="flex items-center gap-1 text-sm font-light" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={14} weight="regular" /> Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--text-secondary)' }}><FactorIcon factor={factor} size={20} weight="thin" /></span>
          <span className="font-normal" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
            {meta.label}
          </span>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-6 py-10">
        {children}
      </div>
    </main>
  )
}
