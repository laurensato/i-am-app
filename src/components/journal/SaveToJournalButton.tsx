'use client'

import JournalWritingIcon from '@/components/JournalWritingIcon'
import { getEntryMonth } from '@/lib/journal'
import { journalSaveErrorMessage } from '@/lib/journalErrors'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

type Props = {
  userId: string
  storageKey: string
  content: string
  disabled?: boolean
}

export default function SaveToJournalButton({ userId, storageKey, content, disabled }: Props) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      setSaved(localStorage.getItem(storageKey) === '1')
    } catch {
      setSaved(false)
    }
  }, [storageKey])

  async function save() {
    const trimmed = content.trim()
    if (saved || saving || disabled || !trimmed) return

    setSaving(true)
    setError('')

    const supabase = createClient()
    const { error: insertError } = await supabase.from('journal_entries').insert({
      user_id: userId,
      content: trimmed,
      entry_month: getEntryMonth(),
    })

    setSaving(false)

    if (insertError) {
      setError(journalSaveErrorMessage(insertError))
      return
    }

    setSaved(true)
    try {
      localStorage.setItem(storageKey, '1')
    } catch {
      // private browsing
    }
  }

  const tooltip = error
    ? error
    : saved
      ? 'Saved to Journal'
      : saving
        ? 'Saving…'
        : 'Save to Journal'

  return (
    <button
      type="button"
      onClick={save}
      disabled={saved || saving || disabled || !content.trim()}
      aria-label={tooltip}
      className="group absolute bottom-3 right-3 flex items-center justify-center rounded-full transition-opacity hover:opacity-90 disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
      style={{ width: 40, height: 40 }}
    >
      <JournalWritingIcon size={36} variant="onDark" animated={!saved && !saving} />
      <span
        className="pointer-events-none absolute right-full mr-2 top-1/2 z-10 max-w-[220px] -translate-y-1/2 whitespace-normal rounded px-2.5 py-1.5 text-[11px] font-medium leading-snug opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{
          backgroundColor: 'var(--warm-white)',
          color: error ? '#dc2626' : 'var(--text-secondary)',
          border: `1px solid ${error ? '#fecaca' : 'var(--parchment)'}`,
          boxShadow: '0 4px 12px color-mix(in srgb, var(--text-primary) 12%, transparent)',
        }}
        role="tooltip"
      >
        {tooltip}
      </span>
    </button>
  )
}
