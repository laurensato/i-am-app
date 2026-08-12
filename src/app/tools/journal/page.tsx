export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/lib/supabase/server'
import JournalClient from '@/components/tools/journal/JournalClient'
import AddToRitualButton from '@/components/rituals/AddToRitualButton'
import type { JournalEntry } from '@/lib/journal'
import { isJournalStorageMissing } from '@/lib/journalErrors'

export default async function JournalToolsPage() {
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

  const { data: entries, error: entriesError } = await supabase
    .from('journal_entries')
    .select('id, content, entry_month, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const storageReady = !isJournalStorageMissing(entriesError)

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
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1
            className="text-2xl font-normal"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
          >
            Journal
          </h1>
          <AddToRitualButton
            userId={user.id}
            stepId="journal"
            factors={factors ?? []}
          />
        </div>
        <p
          className="text-sm font-light leading-relaxed mb-8 max-w-xl"
          style={{ color: 'var(--text-muted)' }}
        >
          Writing helps you name what you feel, notice patterns, and make sense of your day. Each
          entry is collected into a book for that month on your shelf below.
        </p>

        <JournalClient
          initialEntries={(entries ?? []) as JournalEntry[]}
          userId={user.id}
          storageReady={storageReady}
        />
      </div>
    </main>
  )
}
