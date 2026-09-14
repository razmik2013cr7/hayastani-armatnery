-- Run this in Supabase dashboard → SQL Editor → Run.
-- Safe to run multiple times. Two new tables:
--   • pin_sessions — live PIN-device registry (7-device cap, heartbeat)
--   • hidden_tours — built-in tours hidden through the admin panel
create table if not exists public.pin_sessions (
  device text primary key,
  last_seen timestamptz not null default now()
);

alter table public.pin_sessions enable row level security;

drop policy if exists "anyone can manage pin sessions" on public.pin_sessions;
create policy "anyone can manage pin sessions"
  on public.pin_sessions for all
  using (true)
  with check (true);

create table if not exists public.hidden_tours (
  kind text not null check (kind in ('tour', 'card')),
  tour_id text not null,
  created_at timestamptz not null default now(),
  primary key (kind, tour_id)
);

alter table public.hidden_tours enable row level security;

drop policy if exists "anyone can manage hidden tours" on public.hidden_tours;
create policy "anyone can manage hidden tours"
  on public.hidden_tours for all
  using (true)
  with check (true);
