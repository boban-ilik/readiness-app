-- Fixes for the Supabase security linter warnings of 2026-08-24.
--
-- Row Level Security already protects every row in these tables; everything
-- here is defence in depth — removing discoverability and API surface that
-- nothing legitimate uses.

-- ── 1. Pin search_path on the two flagged functions (lint 0011) ──────────────
-- Both bodies schema-qualify every reference (verified against
-- pg_get_functiondef before writing this), so the strict empty search_path is
-- safe. handle_updated_at already has it.
alter function public.handle_new_user() set search_path = '';
alter function public.set_updated_at() set search_path = '';

-- ── 2. Trigger functions are not API endpoints (lints 0028 / 0029) ───────────
-- All three exist only to be fired by triggers. Postgres checks EXECUTE when a
-- trigger is created, not when it fires, so revoking EXECUTE removes the
-- /rest/v1/rpc/* exposure without breaking the triggers.
revoke execute on function public.handle_new_user()    from public, anon, authenticated;
revoke execute on function public.handle_updated_at()  from public, anon, authenticated;
revoke execute on function public.set_updated_at()     from public, anon, authenticated;

-- ── 3. Nothing is queryable before sign-in (lint 0026) ───────────────────────
-- The app has no signed-out reads: every query runs as the authenticated user
-- under RLS, and the Edge Functions use the service role. anon needs nothing.
revoke all on table public.health_snapshots  from anon;
revoke all on table public.journal_entries   from anon;
revoke all on table public.life_events       from anon;
revoke all on table public.notification_log  from anon;
revoke all on table public.profiles          from anon;
revoke all on table public.readiness_scores  from anon;
revoke all on table public.user_profiles     from anon;
revoke all on table public.user_streaks      from anon;
revoke all on table public.weekly_reports    from anon;

-- ── 4. Dead scaffolding tables lose the API entirely (lint 0027) ─────────────
-- Zero references in the app or Edge Functions. profiles and user_streaks are
-- still written by the handle_new_user trigger on signup, which runs as the
-- function owner and is unaffected by these revokes. The three tables the app
-- actually uses (readiness_scores, user_profiles, life_events) keep their
-- authenticated grants — revoking those would break the app.
revoke all on table public.health_snapshots  from authenticated;
revoke all on table public.journal_entries   from authenticated;
revoke all on table public.notification_log  from authenticated;
revoke all on table public.profiles          from authenticated;
revoke all on table public.user_streaks      from authenticated;
revoke all on table public.weekly_reports    from authenticated;
