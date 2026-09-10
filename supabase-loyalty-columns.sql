-- Run this in Supabase dashboard → SQL Editor → Run.
-- Adds ONLY the loyalty-card columns (the one part of the big migration
-- that didn't get applied). Safe to run multiple times.

alter table public.profiles add column if not exists loyalty_stars int not null default 0;
alter table public.profiles add column if not exists loyalty_activated boolean not null default false;
