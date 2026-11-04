-- Fixes for the Supabase security linter warnings of 2026-08-24.
--
-- Edited in 1.2.1 so this file runs on a fresh database: the statements that
-- named handle_new_user, handle_updated_at and the six scaffolding tables
-- (health_snapshots, journal_entries, notification_log, profiles,
-- user_streaks, weekly_reports) were removed, because none of those objects
-- is created by any migration and all were dropped in 20261029000001.
-- Supabase tracks applied migrations by version, so editing this text does
-- not re-run it in production.
--
-- Row Level Security already protects every row in these tables; everything
-- here is defence in depth — removing discoverability and API surface that
-- nothing legitimate uses.

-- ── 1. Pin search_path on the flagged function (lint 0011) ───────────────────
-- The body schema-qualifies every reference (verified against
-- pg_get_functiondef before writing this), so the strict empty search_path is
-- safe. (handle_new_user was altered here too; it was dropped in 20261029000001.)
alter function public.set_updated_at() set search_path = '';

-- ── 2. Trigger functions are not API endpoints (lints 0028 / 0029) ───────────
-- It exists only to be fired by triggers. Postgres checks EXECUTE when a
-- trigger is created, not when it fires, so revoking EXECUTE removes the
-- /rest/v1/rpc/* exposure without breaking the triggers. (handle_new_user and
-- handle_updated_at were revoked here too; both were dropped in 20261029000001.)
revoke execute on function public.set_updated_at()     from public, anon, authenticated;

-- ── 3. Nothing is queryable before sign-in (lint 0026) ───────────────────────
-- The app has no signed-out reads: every query runs as the authenticated user
-- under RLS, and the Edge Functions use the service role. anon needs nothing.
-- (The six scaffolding tables were revoked from anon here too, and section 4
-- revoked them from authenticated; all six were dropped in 20261029000001.)
revoke all on table public.life_events       from anon;
revoke all on table public.readiness_scores  from anon;
revoke all on table public.user_profiles     from anon;
