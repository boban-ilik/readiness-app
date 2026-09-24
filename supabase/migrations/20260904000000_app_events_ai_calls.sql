-- ─────────────────────────────────────────────────────────────────────────────
-- app_events
--
-- Lightweight product analytics, first-party. One row per event the app
-- records against the signed-in user: app_open, score_shown, paywall_shown,
-- briefing_opened, onboarding_complete and so on. Events carry no health
-- values (enforced by convention in src/services/analytics.ts; props is
-- capped at 1 KB here). Clients may only insert their own rows; reading is
-- for the dashboard.
--
-- ai_calls
--
-- Usage ledger written by the AI edge functions (service role only) so they
-- can enforce the free weekly briefing and per-day caps server-side.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.app_events (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users on delete cascade,
  event       text not null check (char_length(event) between 1 and 64),
  props       jsonb not null default '{}'::jsonb check (pg_column_size(props) <= 1024),
  created_at  timestamptz not null default now()
);

create index if not exists app_events_user_created_idx on public.app_events (user_id, created_at desc);
create index if not exists app_events_event_created_idx on public.app_events (event, created_at desc);

alter table public.app_events enable row level security;

revoke all on public.app_events from anon;
revoke all on public.app_events from authenticated;
grant insert on public.app_events to authenticated;

drop policy if exists "insert own events" on public.app_events;
create policy "insert own events"
  on public.app_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);


create table if not exists public.ai_calls (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users on delete cascade,
  fn          text not null check (fn in ('daily-briefing', 'coach-chat', 'weekly-report', 'ai-insight')),
  created_at  timestamptz not null default now()
);

create index if not exists ai_calls_user_fn_created_idx on public.ai_calls (user_id, fn, created_at desc);

alter table public.ai_calls enable row level security;

-- Service role bypasses RLS; nothing else may touch this table.
revoke all on public.ai_calls from anon;
revoke all on public.ai_calls from authenticated;
