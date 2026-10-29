-- Drop the dashboard-made scaffolding nothing uses (1.2.1).
--
-- health_snapshots, journal_entries, notification_log and weekly_reports hold
-- no rows; profiles and user_streaks are written only by the signup trigger
-- handle_new_user, which was created in the dashboard and never by a
-- migration, so a fresh database never had it and the lint-fix migration
-- that altered it could not run there. No app or function code reads any of
-- the six tables. Re-runnable: every statement is guarded.

-- The trigger name is not known, so find every trigger on auth.users that
-- fires public.handle_new_user and drop it.
do $$
declare t record;
begin
  for t in
    select tg.tgname
    from pg_trigger tg
    join pg_proc p      on p.oid = tg.tgfoid
    join pg_namespace n on n.oid = p.pronamespace
    where tg.tgrelid = 'auth.users'::regclass
      and not tg.tgisinternal
      and n.nspname = 'public'
      and p.proname = 'handle_new_user'
  loop
    execute format('drop trigger if exists %I on auth.users', t.tgname);
  end loop;
end $$;

-- Tables first: handle_updated_at still has triggers on profiles, and
-- dropping the tables with cascade removes those before the function goes.
drop table if exists public.health_snapshots cascade;
drop table if exists public.journal_entries  cascade;
drop table if exists public.notification_log cascade;
drop table if exists public.weekly_reports   cascade;
drop table if exists public.profiles         cascade;
drop table if exists public.user_streaks     cascade;

drop function if exists public.handle_new_user();
drop function if exists public.handle_updated_at();
