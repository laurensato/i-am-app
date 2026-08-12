type SupabaseLikeError = {
  code?: string
  message?: string
} | null

export function isJournalStorageMissing(error: SupabaseLikeError): boolean {
  if (!error) return false
  if (error.code === 'PGRST205') return true
  return error.message?.includes('journal_entries') ?? false
}

export function journalSaveErrorMessage(error: SupabaseLikeError): string {
  if (isJournalStorageMissing(error)) {
    return 'Journal storage is not set up in Supabase yet. Run the journal_entries SQL (shown above) in your Supabase SQL Editor, then refresh this page.'
  }

  if (error?.code === '42501') {
    return 'Could not save your entry — permission denied. Check the journal_entries row level security policy in Supabase.'
  }

  return 'Could not save your entry — please try again.'
}
