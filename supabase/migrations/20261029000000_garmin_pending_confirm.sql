-- Garmin OAuth binding (1.2.1). Garmin's callback carries no user session,
-- so the connection it writes is only 'pending' until the app, signed in as
-- the user who started the flow, confirms it with a one-time nonce
-- (garmin-confirm). garmin_connection_status still selects status, and the
-- app treats anything but 'active' as not connected, so a pending row shows
-- as not connected. Re-runnable.

do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.garmin_connections'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%status%'
  loop
    execute format('alter table public.garmin_connections drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.garmin_connections
  add constraint garmin_connections_status_check
  check (status in ('pending', 'active', 'revoked'));

alter table public.garmin_connections add column if not exists confirm_nonce      text;
alter table public.garmin_connections add column if not exists confirm_expires_at timestamptz;
