-- Run in Supabase Dashboard → SQL Editor for project lfzcorpynelawqvlgvhu
-- Safe to re-run: uses IF NOT EXISTS / DO blocks where needed

create table if not exists public.journal_entries (
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

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journal_entries'
      and policyname = 'Users manage own journal entries'
  ) then
    create policy "Users manage own journal entries"
      on public.journal_entries
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- If the table was just created, PostgREST may need a moment to refresh.
-- In Supabase: Settings → API → Reload schema (or wait ~30 seconds).
