-- Run this in your Supabase SQL editor

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  first_name text not null,
  age integer not null,
  gender text not null,
  selected_factors text[] not null default '{}',
  created_at timestamptz default now()
);

create table public.identity_factors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  factor_type text not null,
  discovery_completed boolean default false,
  discovery_data jsonb default '{}',
  results jsonb default '{}',
  created_at timestamptz default now(),
  unique(user_id, factor_type)
);

create table public.daily_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,
  insight text,
  mantra text,
  factor_snapshots jsonb default '{}',
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- Row level security
alter table public.profiles enable row level security;
alter table public.identity_factors enable row level security;
alter table public.daily_messages enable row level security;

create policy "Users manage own profile" on public.profiles for all using (auth.uid() = user_id);
create policy "Users manage own factors" on public.identity_factors for all using (auth.uid() = user_id);
create policy "Users manage own messages" on public.daily_messages for all using (auth.uid() = user_id);
