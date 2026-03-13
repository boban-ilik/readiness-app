-- ─────────────────────────────────────────────────────────────────────────────
-- readiness_scores
--
-- One row per user per calendar day.  The composite readiness score and its
-- three component scores are written by the iOS app (via scoreSync.ts) every
-- time it loads health data.  Raw HealthKit fields are included so the weekly-
-- report Edge Function can form richer narratives without re-fetching HealthKit.
--
-- Conflict strategy: upsert on (user_id, date) — later writes win, which
-- handles the "user updates manual HRV → app re-scores" case gracefully.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.readiness_scores (
  id              uuid primary key default gen_random_uuid(),

  -- Identity
  user_id         uuid not null references auth.users on delete cascade,
  date            date not null,

  -- Composite readiness score (0–100)
  score           smallint not null check (score between 0 and 100),

  -- Component scores (0–100 each)
  recovery_score  smallint not null check (recovery_score between 0 and 100),
  sleep_score     smallint not null check (sleep_score between 0 and 100),
  stress_score    smallint not null check (stress_score between 0 and 100),

  -- Raw HealthKit fields (nullable — device/data availability varies)
  hrv             real,           -- ms (overnight SDNN)
  rhr             smallint,       -- bpm (resting heart rate)
  sleep_duration  smallint,       -- minutes
  sleep_efficiency real,          -- 0–100 %

  -- Timestamps
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- One record per user per day — newer upsert wins
  unique (user_id, date)
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

-- Range queries: "last N days for this user"
create index if not exists readiness_scores_user_date_idx
  on public.readiness_scores (user_id, date desc);

-- ── updated_at trigger ───────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger readiness_scores_updated_at
  before update on public.readiness_scores
  for each row execute function public.set_updated_at();

-- ── Row-Level Security ───────────────────────────────────────────────────────

alter table public.readiness_scores enable row level security;

-- SELECT — users may only read their own rows
create policy "Users can read own scores"
  on public.readiness_scores for select
  using (auth.uid() = user_id);

-- INSERT — users may only insert rows for themselves
create policy "Users can insert own scores"
  on public.readiness_scores for insert
  with check (auth.uid() = user_id);

-- UPDATE — users may only update their own rows
create policy "Users can update own scores"
  on public.readiness_scores for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
