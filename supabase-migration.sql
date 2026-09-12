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
-- Chosen photo package when the photoshoot extra is included ('p1'..'p4').
alter table public.bookings add column if not exists photo_plan text;
-- Chosen meal option when the food extra is included ('f1' | 'f2').
alter table public.bookings add column if not exists food_plan text;

-- Bookings: let visitors see which seats are taken (the live seat map).
drop policy if exists "anyone can view bookings" on public.bookings;
create policy "anyone can view bookings"
  on public.bookings for select
  using (true);

-- One-time wipe (already applied on 2026-09-10 — kept as a comment so
-- re-running this file can never erase real customer bookings again):
-- delete from public.bookings;

-- Silver coins balance for the QR reward page.
alter table public.profiles add column if not exists silver_coins int not null default 0;

-- QR coin claims are relayed over Supabase Realtime **broadcast** —
-- no database table is needed for them.

-- ============================================================
-- Admin-managed tours (created/deleted through the PIN-gated panel).
-- ============================================================
create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  region text not null default 'home' check (region in ('home', 'abroad')),
  days int not null default 3,
  price numeric not null default 0,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.tours enable row level security;

-- Policies can't use "if not exists", so drop-then-create keeps this file re-runnable.
drop policy if exists "anyone can view tours" on public.tours;
create policy "anyone can view tours"
  on public.tours for select
  using (true);

drop policy if exists "anyone can create tours" on public.tours;
create policy "anyone can create tours"
  on public.tours for insert
  with check (true);

drop policy if exists "anyone can delete tours" on public.tours;
create policy "anyone can delete tours"
  on public.tours for delete
  using (true);

-- ============================================================
-- Shop purchase audit log.
-- Each purchase is recorded here. The owner email
-- (rafikmkrtchyan25@gmail.com) is sent directly from the app via
-- FormSubmit — no Edge Function needed.
-- ============================================================
create table if not exists public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  item_id text,
  item_name text not null,
  price_coins int not null default 0,
  buyer_email text,
  buyer_name text,
  created_at timestamptz not null default now()
);

alter table public.shop_orders enable row level security;

drop policy if exists "anyone can record shop orders" on public.shop_orders;
create policy "anyone can record shop orders"
  on public.shop_orders for insert
  with check (true);

-- PIN-gated bus reset: deletes every booking so all seats show free again.
-- RLS blocks direct deletes with the anon key, so the admin panel calls this
-- function instead; it verifies the staff PIN server-side.
create or replace function public.reset_bus_bookings(pin text)
returns void
language plpgsql
security definer
as $$
begin
  if pin is distinct from '2011RLOHN' then
    raise exception 'wrong pin';
  end if;
  delete from public.bookings where true;
end;
$$;

grant execute on function public.reset_bus_bookings(text) to anon, authenticated;

-- Loyalty card («Հավատարմության Քարտ») state for signed-in users.
-- Guests keep the same data in their device's localStorage.
alter table public.profiles add column if not exists loyalty_stars int not null default 0;
alter table public.profiles add column if not exists loyalty_activated boolean not null default false;
