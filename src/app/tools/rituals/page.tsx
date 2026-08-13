export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/lib/supabase/server'
import RitualsClient from '@/components/tools/rituals/RitualsClient'

export default async function RitualsToolsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, age, gender')
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
        <RitualsClient factors={factors ?? []} userId={user.id} profile={profile} />
      </div>
    </main>
  )
}
