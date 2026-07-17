'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FactorType, FACTOR_META, IdentityFactor } from '@/lib/types'
import WesternAstrologyFlow from '@/components/discover/WesternAstrologyFlow'
import EasternAstrologyFlow from '@/components/discover/EasternAstrologyFlow'
import SpiritualityFlow from '@/components/discover/SpiritualityFlow'
import TarotFlow from '@/components/discover/TarotFlow'
import ValuesFlow from '@/components/discover/ValuesFlow'
import IkigaiFlow from '@/components/discover/IkigaiFlow'
import DailyView from '@/components/discover/DailyView'

interface Props {
  factor: FactorType
  factorRow: IdentityFactor
  profile: { first_name: string; age: number; gender: string } | null
  userId: string
}

export default function DiscoverClient({ factor, factorRow, profile, userId }: Props) {
  const router = useRouter()
  const meta = FACTOR_META[factor]

  function onComplete() {
    router.push('/dashboard')
    router.refresh()
  }

  // If already completed, show the daily view
  if (factorRow.discovery_completed) {
    return (
      <PageShell factor={factor}>
        <DailyView factor={factor} factorRow={factorRow} profile={profile} userId={userId} />
      </PageShell>
    )
  }

  // Show the discovery intro + flow
  const Flow = {
    western_astrology: WesternAstrologyFlow,
    eastern_astrology: EasternAstrologyFlow,
    spirituality: SpiritualityFlow,
    tarot: TarotFlow,
    values: ValuesFlow,
    ikigai: IkigaiFlow,
  }[factor]

  return (
    <PageShell factor={factor}>
      <div className="mb-8 p-6 rounded-2xl"
        style={{ backgroundColor: 'rgba(201,169,110,0.1)', borderLeft: '3px solid var(--gold)' }}>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--gold)' }}>
          ⏱ Set aside {meta.time}
        </p>
        <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
          Find a quiet moment for yourself. This discovery is just for you.
        </p>
      </div>
      <Flow factorRow={factorRow} profile={profile} userId={userId} onComplete={onComplete} />
    </PageShell>
  )
}

function PageShell({ factor, children }: { factor: FactorType; children: React.ReactNode }) {
  const meta = FACTOR_META[factor]
  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--cream)' }}>
      <header className="px-6 py-5 flex items-center gap-4 border-b"
        style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)' }}>
        <Link href="/dashboard" className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
          ← Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.emoji}</span>
          <span className="font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
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
