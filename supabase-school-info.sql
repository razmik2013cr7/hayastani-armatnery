-- Run this in Supabase dashboard → SQL Editor → Run (one line, instant).
-- It adds the missing school_info column to bookings.
alter table public.bookings add column if not exists school_info text;
