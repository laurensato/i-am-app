export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/lib/supabase/server'
import BreathworkToolsGrid from '@/components/tools/BreathworkToolsGrid'

export default async function BreathworkToolsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

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
          Breathwork
        </h1>
        <p
          className="text-sm font-light leading-relaxed mb-8 max-w-xl"
          style={{ color: 'var(--text-muted)' }}
        >
          Intentional breathing helps calm a busy mind and ease tension held in the body. It
          activates your parasympathetic nervous system—slowing your heart rate and lowering
          stress—while giving you a steady rhythm to anchor to. Choose a practice below and
          follow the orb at your own pace.
        </p>

        <BreathworkToolsGrid />
      </div>
    </main>
  )
}
