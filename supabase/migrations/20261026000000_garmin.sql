-- ─────────────────────────────────────────────────────────────────────────────
-- Garmin Connect as a direct data source (1.3)
--
-- Garmin pushes daily summaries to the garmin-webhook function; the function
-- writes them here with the service role. The app reads its own rows under
-- RLS. Tokens live in garmin_connections, which no client role can read:
-- the app sees connection state through the garmin_connection_status view.
--
-- Data minimisation: only the fields the score, the coach and the training
-- load use are kept. Disconnecting (in-app, or from Garmin's side via a
-- deregistration push) deletes every row for that user.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── OAuth state: one row per authorisation attempt, short-lived ──────────────
create table if not exists public.garmin_oauth_states (
  state          text primary key,
  user_id        uuid not null references auth.users on delete cascade,
  code_verifier  text not null,
  created_at     timestamptz not null default now()
);
alter table public.garmin_oauth_states enable row level security;
revoke all on public.garmin_oauth_states from anon, authenticated;

-- ── Connection and tokens: service role only ─────────────────────────────────
create table if not exists public.garmin_connections (
  user_id             uuid primary key references auth.users on delete cascade,
  garmin_user_id      text not null unique,
  access_token        text not null,
  refresh_token       text not null,
  access_expires_at   timestamptz not null,
  refresh_expires_at  timestamptz not null,
  permissions         text[] not null default '{}',
  status              text not null default 'active' check (status in ('active', 'revoked')),
  connected_at        timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
alter table public.garmin_connections enable row level security;
revoke all on public.garmin_connections from anon, authenticated;
drop trigger if exists garmin_connections_updated_at on public.garmin_connections;
create trigger garmin_connections_updated_at
  before update on public.garmin_connections
  for each row execute function public.set_updated_at();

-- What the app may see: no tokens.
create or replace view public.garmin_connection_status
  with (security_invoker = true) as
  select user_id, garmin_user_id, permissions, status, connected_at, updated_at
  from public.garmin_connections;
grant select on public.garmin_connection_status to authenticated;
-- The view runs as the caller, so the caller needs a policy on the base table
-- for exactly their row. Tokens stay hidden because the view omits them and
-- the table itself has no grant for authenticated.
grant select (user_id, garmin_user_id, permissions, status, connected_at, updated_at)
  on public.garmin_connections to authenticated;
drop policy if exists "read own connection" on public.garmin_connections;
create policy "read own connection" on public.garmin_connections
  for select to authenticated using (auth.uid() = user_id);

-- ── Daily summary ("dailies"): one row per calendar day ───────────────────────
create table if not exists public.garmin_daily (
  user_id               uuid not null references auth.users on delete cascade,
  calendar_date         date not null,
  summary_id            text,
  start_time            timestamptz,
  start_offset_sec      int,
  duration_sec          int not null default 0,
  steps                 int,
  distance_m            real,
  active_kcal           int,
  bmr_kcal              int,
  resting_hr            smallint,
  min_hr                smallint,
  max_hr                smallint,
  avg_stress            smallint,
  max_stress            smallint,
  stress_sec            int,
  rest_stress_sec       int,
  activity_stress_sec   int,
  stress_qualifier      text,
  body_battery_charged  smallint,
  body_battery_drained  smallint,
  moderate_sec          int,
  vigorous_sec          int,
  floors_climbed        int,
  updated_at            timestamptz not null default now(),
  primary key (user_id, calendar_date)
);

-- ── Sleep: one row per sleep window (two can share a calendar date) ──────────
create table if not exists public.garmin_sleep (
  user_id           uuid not null references auth.users on delete cascade,
  start_time        timestamptz not null,
  calendar_date     date not null,
  summary_id        text,
  start_offset_sec  int,
  duration_sec      int not null default 0,
  deep_sec          int,
  light_sec         int,
  rem_sec           int,
  awake_sec         int,
  unmeasurable_sec  int,
  nap_sec           int,
  validation        text,
  sleep_score       smallint,
  sleep_quality     text,
  updated_at        timestamptz not null default now(),
  primary key (user_id, start_time)
);
create index if not exists garmin_sleep_user_date_idx on public.garmin_sleep (user_id, calendar_date desc);

-- ── Overnight HRV: one row per night ─────────────────────────────────────────
create table if not exists public.garmin_hrv (
  user_id               uuid not null references auth.users on delete cascade,
  calendar_date         date not null,
  summary_id            text,
  start_time            timestamptz,
  start_offset_sec      int,
  duration_sec          int,
  last_night_avg        smallint,     -- ms, RMSSD (not Apple's SDNN)
  last_night_5min_high  smallint,
  values_5min           jsonb,        -- offset seconds -> ms
  updated_at            timestamptz not null default now(),
  primary key (user_id, calendar_date)
);

-- ── Stress and Body Battery series: several chunks per day ───────────────────
create table if not exists public.garmin_stress (
  user_id              uuid not null references auth.users on delete cascade,
  start_time           timestamptz not null,
  calendar_date        date not null,
  summary_id           text,
  start_offset_sec     int,
  duration_sec         int,
  stress_values        jsonb,  -- offset seconds -> 1..100, negatives are flags
  body_battery_values  jsonb,  -- offset seconds -> 0..100
  updated_at           timestamptz not null default now(),
  primary key (user_id, start_time)
);
create index if not exists garmin_stress_user_date_idx on public.garmin_stress (user_id, calendar_date desc);

-- ── User metrics: VO2 max and fitness age ────────────────────────────────────
create table if not exists public.garmin_user_metrics (
  user_id          uuid not null references auth.users on delete cascade,
  calendar_date    date not null,
  summary_id       text,
  vo2_max          real,
  vo2_max_cycling  real,
  fitness_age      smallint,
  enhanced         boolean,
  updated_at       timestamptz not null default now(),
  primary key (user_id, calendar_date)
);

-- ── Hydration ────────────────────────────────────────────────────────────────
create table if not exists public.garmin_hydration (
  user_id        uuid not null references auth.users on delete cascade,
  calendar_date  date not null,
  summary_id     text,
  fluid_ml       int,
  updated_at     timestamptz not null default now(),
  primary key (user_id, calendar_date)
);

-- ── Activities: one row per session ──────────────────────────────────────────
create table if not exists public.garmin_activities (
  user_id            uuid not null references auth.users on delete cascade,
  summary_id         text not null,
  activity_id        text,
  activity_type      text,
  activity_name      text,
  start_time         timestamptz,
  start_offset_sec   int,
  duration_sec       int,
  avg_hr             smallint,
  max_hr             smallint,
  distance_m         real,
  active_kcal        int,
  steps              int,
  device_name        text,
  manual             boolean,
  parent_summary_id  text,
  updated_at         timestamptz not null default now(),
  primary key (user_id, summary_id)
);
create index if not exists garmin_activities_user_start_idx on public.garmin_activities (user_id, start_time desc);

-- ── RLS on the data tables: the app reads its own rows, the service role writes
do $$
declare t text;
begin
  foreach t in array array['garmin_daily','garmin_sleep','garmin_hrv','garmin_stress','garmin_user_metrics','garmin_hydration','garmin_activities'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke all on public.%I from authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('drop policy if exists "read own rows" on public.%I', t);
    execute format('create policy "read own rows" on public.%I for select to authenticated using (auth.uid() = user_id)', t);
    execute format('drop trigger if exists %I_updated_at on public.%I', t, t);
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ── Token keepalive: refresh tokens die after three months unused ────────────
-- A cron job calls garmin-keepalive every six hours. The shared secret is read
-- from Vault (name garmin_cron_secret), set by hand, never committed.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Scheduled once: a second run of this file leaves the existing job alone.
do $$
begin
  if not exists (select 1 from cron.job where jobname = 'garmin-keepalive') then
    perform cron.schedule(
      'garmin-keepalive',
      '17 */6 * * *',
      $cron$
      select net.http_post(
        url     := 'https://vgvrmhqkcqdimgwzbbhc.supabase.co/functions/v1/garmin-keepalive',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'garmin_cron_secret')
        ),
        body    := '{}'::jsonb
      );
      $cron$
    );
  end if;
end $$;
