-- User profiles
-- Profile details (name, age, sex, height, weight, goal, training frequency)
-- previously lived only in AsyncStorage, so they were lost on reinstall and
-- never followed the user to a second device. Storing them against the account
-- makes the profile part of the user rather than part of the phone.

create table if not exists public.user_profiles (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  name               text,
  age                int  check (age is null or (age > 0 and age < 130)),
  sex                text check (sex is null or sex in ('male', 'female', 'prefer_not_to_say')),
  height_cm          numeric check (height_cm is null or (height_cm > 0 and height_cm < 300)),
  weight_kg          numeric check (weight_kg is null or (weight_kg > 0 and weight_kg < 500)),
  training_frequency text check (training_frequency is null or training_frequency in ('light', 'moderate', 'high')),
  primary_goal       text check (primary_goal is null or primary_goal in ('performance', 'recovery', 'weight_loss', 'general_health')),
  device_type        text,
  onboarded_at       timestamptz,
  updated_at         timestamptz default now()
);

-- Row Level Security
alter table public.user_profiles enable row level security;

create policy "Users manage their own profile"
  on public.user_profiles for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
