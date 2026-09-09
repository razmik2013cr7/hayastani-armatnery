-- Run this in the Supabase dashboard (SQL Editor) for project xpodpnzdwkmeticzbvvb.
-- It creates the profiles + bookings tables used by Հայաստանի Արմատները.

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  silver_coins int not null default 0,
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
  days int not null default 1,
  seats text not null,
  tour_type text,
  buyer_name text,
  photoshoot boolean not null default false,
  food boolean not null default false,
  cottage boolean not null default false,
  payment_method text,
  total_amd int not null,
  card_last4 text,
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

-- Guests may buy tickets without an account.
create policy "anyone can create a booking"
  on public.bookings for insert
  with check (true);

-- If you already ran the previous version of this file, migrate instead:
-- alter table public.bookings drop column if exists people_count;
-- alter table public.bookings add column if not exists days int not null default 1;
-- alter table public.bookings add column if not exists tour_type text;
-- alter table public.bookings add column if not exists payment_method text;
-- alter table public.bookings add column if not exists buyer_name text;
-- create policy "anyone can view bookings" on public.bookings for select using (true);
-- alter table public.profiles add column if not exists silver_coins int not null default 0;

-- The live seat map reads all bookings (only seat/tour/name columns are used by the UI).
create policy "anyone can view bookings"
  on public.bookings for select
  using (true);

-- Signed-in users can read their own bookings.
create policy "users can view own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);
