-- Run this ONCE in the Supabase dashboard → SQL Editor (project xpodpnzdwkmeticzbvvb).
-- It does two things:
--   1. Deletes all current bookings (the test purchases) so every seat is free.
--   2. Creates the reset_bus_bookings(pin) function used by the site's
--      "🚌 Մաքրել ավտոբուսը" admin button, so future cleaning is one click.

delete from public.bookings where true;

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
