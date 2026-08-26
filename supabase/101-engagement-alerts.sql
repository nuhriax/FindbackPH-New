/*
 * FindBack PH — Phase 16: Engagement & user-signal tables.
 *
 * Safe to re-run against an existing database (uses IF NOT EXISTS /
 * DROP POLICY IF EXISTS). Run this AFTER schema.sql.
 *
 *   1. alert_preferences  — persistent per-user match-alert settings
 *      (the foundation for emailing owners when a new possible match appears).
 *   2. reunite_feedback    — the 3-tap "Did it reunite?" user signal from the
 *      dashboard, plus an optional 1-5 rating. Unique per (user, report).
 */

-- ----------------------------------------------------------------------------
-- ALERT PREFERENCES (one row per user)
-- ----------------------------------------------------------------------------
create table if not exists public.alert_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  enable_match_alerts boolean not null default true,
  match_city text,
  match_category text,
  updated_at timestamptz not null default now()
);

alter table public.alert_preferences enable row level security;

drop policy if exists "users read own alert prefs" on public.alert_preferences;
create policy "users read own alert prefs"
  on public.alert_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "users upsert own alert prefs" on public.alert_preferences;
create policy "users upsert own alert prefs"
  on public.alert_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own alert prefs" on public.alert_preferences;
create policy "users update own alert prefs"
  on public.alert_preferences for update
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- REUNITE FEEDBACK — 3-tap "Did it reunite?" signal
-- ----------------------------------------------------------------------------
create table if not exists public.reunite_feedback (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type conversation_item_type not null,
  item_id uuid not null,
  reunited boolean not null,
  rating integer check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

alter table public.reunite_feedback enable row level security;

drop policy if exists "users read own feedback" on public.reunite_feedback;
create policy "users read own feedback"
  on public.reunite_feedback for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own feedback" on public.reunite_feedback;
create policy "users insert own feedback"
  on public.reunite_feedback for insert
  with check (auth.uid() = user_id);