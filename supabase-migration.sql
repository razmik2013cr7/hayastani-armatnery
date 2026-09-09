-- ============================================================
-- ONE-TIME MIGRATION — run this in Supabase dashboard → SQL Editor → Run
-- (project xpodpnzdwkmeticzbvvb)
--
-- Safe to run multiple times. Adds everything the newest app version
-- expects to tables that were created from the older schema:
--   • bookings: days, tour_type, payment_method, buyer_name + public read
--   • profiles: silver_coins
-- ============================================================

-- Bookings: new columns
alter table public.bookings add column if not exists days int not null default 1;
alter table public.bookings add column if not exists tour_type text;
alter table public.bookings add column if not exists payment_method text;
alter table public.bookings add column if not exists buyer_name text;

-- Bookings: let visitors see which seats are taken (the live seat map).
drop policy if exists "anyone can view bookings" on public.bookings;
create policy "anyone can view bookings"
  on public.bookings for select
  using (true);

-- Silver coins balance for the QR reward page.
alter table public.profiles add column if not exists silver_coins int not null default 0;

-- QR coin claims are relayed over Supabase Realtime **broadcast** —
-- no database table is needed for them.
