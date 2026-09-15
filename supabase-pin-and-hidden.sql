-- Run this in Supabase dashboard → SQL Editor → Run.
-- Safe to run multiple times. Adds everything this version needs that the
-- live DB is still missing:
--   • pin_sessions    — live PIN-device registry (7-device cap, heartbeat)
--   • hidden_tours    — built-in tours hidden through the admin panel
--   • tour_discounts  — owner-set percent discounts (regular tours only)
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

-- Owner-set discounts: percent off, REGULAR tours only (kind='tour').
-- The app never writes kind='card' rows.
create table if not exists public.tour_discounts (
  kind text not null default 'tour' check (kind in ('tour')),
  tour_id text not null,
  discount int not null check (discount between 1 and 99),
  created_at timestamptz not null default now(),
  primary key (kind, tour_id)
);

alter table public.tour_discounts enable row level security;

drop policy if exists "anyone can manage tour discounts" on public.tour_discounts;
create policy "anyone can manage tour discounts"
  on public.tour_discounts for all
  using (true)
  with check (true);
-- Run this in Supabase dashboard → SQL Editor → Run.
-- Creates the count_all_accounts() function the 👤 user counter uses.
--
-- Returns the TOTAL number of accounts in the project's auth.users table —
-- everyone who has ever signed up (email-confirmed or not), not just users
-- who have a profiles row. SECURITY DEFINER lets the anon key call it
-- without exposing the auth schema to visitors.
create or replace function public.count_all_accounts()
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int from auth.users;
$$;

grant execute on function public.count_all_accounts() to anon, authenticated;
