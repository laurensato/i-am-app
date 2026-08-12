export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/lib/supabase/server'
import VisualizationsToolsGrid from '@/components/tools/visualizations/VisualizationsToolsGrid'

export default async function VisualizationsToolsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const { data: factors } = await supabase
    .from('identity_factors')
    .select('*')
    .eq('user_id', user.id)

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--cream)' }}>
      <header
        className="px-6 py-5 flex items-center gap-4 border-b"
        style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)' }}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm font-light transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={16} weight="regular" />
          Dashboard
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1
          className="text-2xl font-normal mb-3"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
        >
          Visualizations
        </h1>
        <p
          className="text-sm font-light leading-relaxed mb-8 max-w-xl"
          style={{ color: 'var(--text-muted)' }}
        >
          Guided imagery helps your mind rehearse calm, clarity, and possibility—while your body
          often responds as if the scene were real, easing muscle tension and quieting stress
          responses. Choose a visualization below when you want to reset, refocus, or reconnect
          with how you want to feel.
        </p>

        <VisualizationsToolsGrid userId={user.id} factors={factors ?? []} />
      </div>
    </main>
  )
}
