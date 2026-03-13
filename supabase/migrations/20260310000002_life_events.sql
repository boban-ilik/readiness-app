-- Life events table
-- Users tag days with contextual events (illness, alcohol, travel, etc.)
-- so the AI can learn personal cause-and-effect rather than just patterns.

create table if not exists life_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  event_type text not null check (event_type in (
    'alcohol', 'illness', 'travel', 'stress', 'poor_sleep',
    'medication', 'intense_workout', 'other'
  )),
  notes      text,
  created_at timestamptz default now()
);

-- Fast lookup by user + date range (used by coach-chat context)
create index if not exists life_events_user_date_idx on life_events (user_id, date desc);

-- Row Level Security
alter table life_events enable row level security;

create policy "Users manage their own life events"
  on life_events for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
