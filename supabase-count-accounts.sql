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
