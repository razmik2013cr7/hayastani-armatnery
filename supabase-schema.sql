-- Run this in the Supabase dashboard (SQL Editor) for project xpodpnzdwkmeticzbvvb.
-- It creates the profiles + bookings tables used by Հայաստանի Արմատները.

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------- bookings ----------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  tour_id text not null,
  people_count int not null default 1,
  seats text not null,
  photoshoot boolean not null default false,
  food boolean not null default false,
  cottage boolean not null default false,
  total_amd int not null,
  card_last4 text,
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

-- Guests may buy tickets without an account.
create policy "anyone can create a booking"
  on public.bookings for insert
  with check (true);

-- Signed-in users can read their own bookings.
create policy "users can view own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);
