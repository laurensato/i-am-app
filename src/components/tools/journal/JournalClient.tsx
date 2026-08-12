'use client'

import {
  bookHeightPx,
  entriesForMonth,
  formatEntryDate,
  formatEntryTime,
  formatMonthLabel,
  getEntryMonth,
  groupEntriesByMonth,
  spineColorForMonth,
  type JournalEntry,
} from '@/lib/journal'
import { pickJournalPrompt } from '@/lib/journalPrompts'
import { journalSaveErrorMessage } from '@/lib/journalErrors'
import { createClient } from '@/lib/supabase/client'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { useMemo, useRef, useState } from 'react'

type Props = {
  initialEntries: JournalEntry[]
  userId: string
  storageReady: boolean
}

export default function JournalClient({ initialEntries, userId, storageReady }: Props) {
  const [entries, setEntries] = useState(initialEntries)
  const [draft, setDraft] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const monthViewRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null)

  const books = useMemo(() => groupEntriesByMonth(entries), [entries])

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const matchingEntries = useMemo(() => {
    if (!normalizedQuery) return []
    return entries.filter(entry => entry.content.toLowerCase().includes(normalizedQuery))
  }, [entries, normalizedQuery])

  const matchingMonths = useMemo(
    () => new Set(matchingEntries.map(entry => entry.entry_month)),
    [matchingEntries]
  )

  const visibleBooks = useMemo(() => {
    if (!normalizedQuery) return books
    return books.filter(book => matchingMonths.has(book.entryMonth))
  }, [books, matchingMonths, normalizedQuery])

  const selectedEntries = useMemo(() => {
    if (!selectedMonth) return []

    const monthEntries = entriesForMonth(entries, selectedMonth)
    if (!normalizedQuery) return monthEntries

    return monthEntries.filter(entry =>
      entry.content.toLowerCase().includes(normalizedQuery)
    )
  }, [entries, normalizedQuery, selectedMonth])

  function openMonth(entryMonth: string) {
    setSelectedMonth(entryMonth)
    requestAnimationFrame(() => {
      monthViewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  async function saveEntry() {
    const content = draft.trim()
    if (!content || saving) return

    setSaving(true)
    setSaveError('')

    const entryMonth = getEntryMonth()
    const supabase = createClient()
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ user_id: userId, content, entry_month: entryMonth })
      .select('id, content, entry_month, created_at')
      .single()

    setSaving(false)

    if (error || !data) {
      setSaveError(journalSaveErrorMessage(error))
      return
    }

    setEntries(current => [data, ...current])
    setDraft('')
    setCurrentPrompt(null)
  }

  function suggestPrompt() {
    setCurrentPrompt(current => pickJournalPrompt(current ?? undefined))
  }

  return (
    <div className="flex flex-col gap-8">
      {!storageReady && (
        <div
          className="px-4 py-3 border text-sm font-light leading-relaxed flex flex-col gap-3"
          style={{
            borderColor: 'var(--parchment)',
            backgroundColor: 'color-mix(in srgb, var(--warm-white) 90%, var(--parchment))',
            color: 'var(--text-secondary)',
          }}
        >
          <p>
            Journal storage is not connected yet. Open your Supabase project → SQL Editor, paste the
            script below, click Run, then refresh this page.
          </p>
          <pre
            className="text-xs overflow-x-auto p-3 border whitespace-pre-wrap"
            style={{
              borderColor: 'var(--parchment)',
              backgroundColor: 'var(--warm-white)',
              color: 'var(--text-primary)',
            }}
          >
            {`create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  entry_month date not null,
  created_at timestamptz default now()
);

create index if not exists journal_entries_user_month_idx
  on public.journal_entries (user_id, entry_month desc);

create index if not exists journal_entries_user_created_idx
  on public.journal_entries (user_id, created_at desc);

alter table public.journal_entries enable row level security;

create policy "Users manage own journal entries"
  on public.journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);`}
          </pre>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <button
          type="button"
          onClick={suggestPrompt}
          className="self-start px-4 py-2 text-xs font-medium border transition-opacity hover:opacity-80"
          style={{
            borderColor: 'var(--parchment)',
            backgroundColor: 'var(--warm-white)',
            color: 'var(--text-secondary)',
          }}
        >
          {currentPrompt ? 'Another prompt' : 'Suggest a prompt'}
        </button>

        {currentPrompt && (
          <p
            className="px-4 py-3 border text-sm font-light leading-relaxed"
            style={{
              borderColor: 'var(--parchment)',
              backgroundColor: 'color-mix(in srgb, var(--warm-white) 88%, var(--parchment))',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-serif)',
            }}
          >
            {currentPrompt}
          </p>
        )}

        <label htmlFor="journal-entry" className="sr-only">
          New journal entry
        </label>
        <textarea
          id="journal-entry"
          rows={5}
          placeholder="What's on your mind today?"
          value={draft}
          onChange={event => setDraft(event.target.value)}
          className="w-full px-4 py-3 border outline-none text-sm leading-relaxed resize-none"
          style={{
            borderColor: 'var(--parchment)',
            backgroundColor: 'var(--warm-white)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-serif)',
          }}
        />
        <div className="flex items-center justify-between gap-3">
          {saveError ? (
            <p className="text-xs text-red-600">{saveError}</p>
          ) : (
            <span className="text-[11px] font-light" style={{ color: 'var(--text-muted)' }}>
              Entries are grouped into a book for each month.
            </span>
          )}
          <button
            type="button"
            onClick={saveEntry}
            disabled={!draft.trim() || saving}
            className="px-5 py-2.5 text-xs font-medium disabled:opacity-50"
            style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-text)' }}
          >
            {saving ? 'Saving…' : 'Save entry'}
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <label htmlFor="journal-search" className="sr-only">
          Search prior entries
        </label>
        <div
          className="flex items-center gap-2 px-3 py-2.5 border"
          style={{ borderColor: 'var(--parchment)', backgroundColor: 'var(--warm-white)' }}
        >
          <MagnifyingGlass size={16} weight="regular" style={{ color: 'var(--text-muted)' }} />
          <input
            id="journal-search"
            type="search"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Search prior entries"
            className="w-full bg-transparent outline-none text-sm font-light"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        <div
          className="relative px-4 pt-8 pb-5 overflow-hidden"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--parchment) 28%, var(--warm-white))',
            border: '1px solid var(--parchment)',
          }}
        >
          {books.length === 0 ? (
            <p
              className="min-h-[120px] flex items-center justify-center text-sm font-light text-center px-4"
              style={{ color: 'var(--text-muted)' }}
            >
              Your bookshelf is waiting. Save your first entry and its month&apos;s book will appear here.
            </p>
          ) : visibleBooks.length === 0 ? (
            <p
              className="min-h-[120px] flex items-center justify-center text-sm font-light text-center px-4"
              style={{ color: 'var(--text-muted)' }}
            >
              No entries match your search.
            </p>
          ) : (
            <div className="flex items-end gap-2 min-h-[132px] flex-wrap">
              {visibleBooks.map(book => {
                const selected = selectedMonth === book.entryMonth

                return (
                  <button
                    key={book.entryMonth}
                    type="button"
                    onClick={() => openMonth(book.entryMonth)}
                    className="relative shrink-0 cursor-pointer transition-all hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                      width: 42,
                      height: bookHeightPx(book.entryCount),
                      transform: selected ? 'translateY(-6px)' : undefined,
                      outlineColor: 'var(--text-muted)',
                    }}
                    aria-label={`Open ${book.label}, ${book.entryCount} ${book.entryCount === 1 ? 'entry' : 'entries'}`}
                    aria-pressed={selected}
                  >
                    <div
                      className="absolute inset-0 rounded-sm"
                      style={{
                        backgroundColor: spineColorForMonth(book.entryMonth),
                        boxShadow: selected
                          ? '0 10px 18px color-mix(in srgb, var(--text-primary) 18%, transparent)'
                          : '0 4px 10px color-mix(in srgb, var(--text-primary) 10%, transparent)',
                      }}
                    />
                    <div
                      className="absolute inset-y-2 left-1.5 w-px"
                      style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}
                    />
                    <span
                      className="absolute inset-0 flex items-center justify-center px-1 text-[9px] font-medium tracking-[0.16em] uppercase text-center leading-tight"
                      style={{
                        color: 'rgba(255,255,255,0.92)',
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed',
                        transform: 'rotate(180deg)',
                      }}
                    >
                      {book.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <div
            className="absolute bottom-0 left-0 right-0 h-3"
            style={{ backgroundColor: 'var(--parchment)' }}
          />
          <div
            className="absolute bottom-3 left-0 right-0 h-1"
            style={{ backgroundColor: 'color-mix(in srgb, var(--im-ink) 10%, var(--parchment))' }}
          />
        </div>

        {books.length > 0 && !selectedMonth && (
          <p className="text-xs font-light text-center" style={{ color: 'var(--text-muted)' }}>
            {normalizedQuery
              ? 'Matching books are on the shelf — click one to read those entries.'
              : 'Click a book to read that month\u2019s entries.'}
          </p>
        )}

        {selectedMonth && (
          <div ref={monthViewRef} className="flex flex-col gap-3 scroll-mt-6">
            <h2
              className="text-sm font-normal"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
            >
              {formatMonthLabel(selectedMonth)}
            </h2>
            {selectedEntries.length === 0 ? (
              <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>
                No entries in this month match your search.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {selectedEntries.map(entry => (
                  <article
                    key={entry.id}
                    className="px-4 py-4 border"
                    style={{
                      borderColor: 'var(--parchment)',
                      backgroundColor: 'var(--warm-white)',
                    }}
                  >
                    <p className="text-[10px] font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                      {formatEntryDate(entry.created_at)} · {formatEntryTime(entry.created_at)}
                    </p>
                    <p
                      className="text-sm font-light leading-relaxed whitespace-pre-wrap"
                      style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-serif)' }}
                    >
                      {entry.content}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
