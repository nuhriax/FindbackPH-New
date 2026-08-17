-- ============================================================================
-- FindBack PH — Database Schema (Phase 1-3: auth, profiles, lost/found items)
-- Run this in Supabase SQL Editor after creating your project.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- ============================================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fuzzy text search

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
do $$ begin
  create type item_status as enum ('active', 'matched', 'recovered', 'archived', 'removed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type item_category as enum (
    'phones', 'wallets', 'ids', 'bags', 'keys', 'jewelry',
    'electronics', 'documents', 'clothing', 'pets', 'school_items', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('user', 'moderator', 'admin');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- PROFILES
-- One row per auth.users row (created via trigger on signup).
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  first_name text not null,
  last_name text not null,
  avatar_url text,
  role user_role not null default 'user',
  successful_returns integer not null default 0,
  is_suspended boolean not null default false,
  is_banned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (username);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)) || '_' || substr(new.id::text, 1, 4),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- LOCATIONS (simple reference table — Philippine cities/provinces)
-- ----------------------------------------------------------------------------
create table if not exists public.locations (
  id serial primary key,
  city text not null,
  province text not null,
  unique (city, province)
);

-- ----------------------------------------------------------------------------
-- LOST ITEMS
-- ----------------------------------------------------------------------------
create table if not exists public.lost_items (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category item_category not null,
  description text not null,
  distinguishing_features text,
  date_lost date not null,
  city text not null,
  province text not null,
  approximate_location text, -- e.g. "Near SM North EDSA" — never exact address
  reward_amount integer, -- in PHP, optional
  status item_status not null default 'active',
  search_vector tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.found_items (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category item_category not null,
  description text not null,
  distinguishing_features text,
  date_found date not null,
  city text not null,
  province text not null,
  approximate_location text,
  current_holding_info text, -- e.g. "Kept at barangay hall" — no exact address
  status item_status not null default 'active',
  search_vector tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lost_items_reporter_idx on public.lost_items (reporter_id);
create index if not exists lost_items_category_idx on public.lost_items (category);
create index if not exists lost_items_status_idx on public.lost_items (status);
create index if not exists lost_items_city_idx on public.lost_items (city);
create index if not exists lost_items_search_idx on public.lost_items using gin (search_vector);

create index if not exists found_items_reporter_idx on public.found_items (reporter_id);
create index if not exists found_items_category_idx on public.found_items (category);
create index if not exists found_items_status_idx on public.found_items (status);
create index if not exists found_items_city_idx on public.found_items (city);
create index if not exists found_items_search_idx on public.found_items using gin (search_vector);

-- Keep search_vector in sync
create or replace function public.lost_items_search_trigger() returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.distinguishing_features, '')), 'C');
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists lost_items_search_update on public.lost_items;
create trigger lost_items_search_update
  before insert or update on public.lost_items
  for each row execute procedure public.lost_items_search_trigger();

create or replace function public.found_items_search_trigger() returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.distinguishing_features, '')), 'C');
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists found_items_search_update on public.found_items;
create trigger found_items_search_update
  before insert or update on public.found_items
  for each row execute procedure public.found_items_search_trigger();

-- ----------------------------------------------------------------------------
-- ITEM IMAGES
-- ----------------------------------------------------------------------------
create table if not exists public.item_images (
  id uuid primary key default uuid_generate_v4(),
  lost_item_id uuid references public.lost_items(id) on delete cascade,
  found_item_id uuid references public.found_items(id) on delete cascade,
  storage_path text not null, -- path within the 'item-images' Storage bucket
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint item_images_one_parent check (
    (lost_item_id is not null and found_item_id is null) or
    (lost_item_id is null and found_item_id is not null)
  )
);

create index if not exists item_images_lost_idx on public.item_images (lost_item_id);
create index if not exists item_images_found_idx on public.item_images (found_item_id);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.lost_items enable row level security;
alter table public.found_items enable row level security;
alter table public.item_images enable row level security;
alter table public.locations enable row level security;

-- Profiles: anyone can read public profile fields; only the owner can update.
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Lost items: anyone can read active listings; owner can read/update/delete their own regardless of status.
drop policy if exists "lost_items_select_active" on public.lost_items;
create policy "lost_items_select_active" on public.lost_items for select
  using (status = 'active' or reporter_id = auth.uid());

drop policy if exists "lost_items_insert_own" on public.lost_items;
create policy "lost_items_insert_own" on public.lost_items for insert
  with check (reporter_id = auth.uid());

drop policy if exists "lost_items_update_own" on public.lost_items;
create policy "lost_items_update_own" on public.lost_items for update
  using (reporter_id = auth.uid());

drop policy if exists "lost_items_delete_own" on public.lost_items;
create policy "lost_items_delete_own" on public.lost_items for delete
  using (reporter_id = auth.uid());

-- Found items: same pattern
drop policy if exists "found_items_select_active" on public.found_items;
create policy "found_items_select_active" on public.found_items for select
  using (status = 'active' or reporter_id = auth.uid());

drop policy if exists "found_items_insert_own" on public.found_items;
create policy "found_items_insert_own" on public.found_items for insert
  with check (reporter_id = auth.uid());

drop policy if exists "found_items_update_own" on public.found_items;
create policy "found_items_update_own" on public.found_items for update
  using (reporter_id = auth.uid());

drop policy if exists "found_items_delete_own" on public.found_items;
create policy "found_items_delete_own" on public.found_items for delete
  using (reporter_id = auth.uid());

-- Item images: readable if the parent item is readable; writable only by parent owner.
drop policy if exists "item_images_select" on public.item_images;
create policy "item_images_select" on public.item_images for select
  using (
    exists (select 1 from public.lost_items li where li.id = lost_item_id and (li.status = 'active' or li.reporter_id = auth.uid()))
    or exists (select 1 from public.found_items fi where fi.id = found_item_id and (fi.status = 'active' or fi.reporter_id = auth.uid()))
  );

drop policy if exists "item_images_insert" on public.item_images;
create policy "item_images_insert" on public.item_images for insert
  with check (
    exists (select 1 from public.lost_items li where li.id = lost_item_id and li.reporter_id = auth.uid())
    or exists (select 1 from public.found_items fi where fi.id = found_item_id and fi.reporter_id = auth.uid())
  );

drop policy if exists "item_images_delete" on public.item_images;
create policy "item_images_delete" on public.item_images for delete
  using (
    exists (select 1 from public.lost_items li where li.id = lost_item_id and li.reporter_id = auth.uid())
    or exists (select 1 from public.found_items fi where fi.id = found_item_id and fi.reporter_id = auth.uid())
  );

drop policy if exists "locations_select_all" on public.locations;
create policy "locations_select_all" on public.locations for select using (true);

-- ----------------------------------------------------------------------------
-- SEED: Philippine cities (small starter list — extend as needed)
-- ----------------------------------------------------------------------------
insert into public.locations (city, province) values
  ('Quezon City', 'Metro Manila'),
  ('Manila', 'Metro Manila'),
  ('Makati', 'Metro Manila'),
  ('Pasig', 'Metro Manila'),
  ('Taguig', 'Metro Manila'),
  ('Cebu City', 'Cebu'),
  ('Davao City', 'Davao del Sur'),
  ('Baguio', 'Benguet'),
  ('Baliuag', 'Bulacan'),
    ('Angeles City', 'Pampanga')
on conflict (city, province) do nothing;

-- ===========================================================================
-- Phase 4-10: Additional tables for messaging, notifications, matching, etc.
-- ===========================================================================

do $$ begin
  create type conversation_item_type as enum ('lost_item', 'found_item');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum ('new_message', 'possible_match', 'report_update', 'item_returned', 'moderation_action');
exception when duplicate_object then null; end $$;

do $$ begin
  create type flag_reason as enum ('scam', 'fake_report', 'harassment', 'suspicious_behavior', 'inappropriate_content', 'wrong_information', 'other');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- CONVERSATIONS — one thread per (item, pair of users)
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  item_type conversation_item_type not null,
  item_id uuid not null,
  participant_a uuid not null references public.profiles(id) on delete cascade,
  participant_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_type, item_id, participant_a, participant_b)
);

create index if not exists conversations_item_idx on public.conversations (item_type, item_id);
create index if not exists conversations_participant_idx on public.conversations (participant_a, participant_b);

-- ---------------------------------------------------------------------------
-- MESSAGES
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read_by_receiver boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  message text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, read, created_at desc);

-- ---------------------------------------------------------------------------
-- MATCHES — generated by the matching engine
-- ---------------------------------------------------------------------------
create table if not exists public.matches (
  id uuid primary key default uuid_generate_v4(),
  lost_item_id uuid not null references public.lost_items(id) on delete cascade,
  found_item_id uuid not null references public.found_items(id) on delete cascade,
  score numeric(5,2),
  dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (lost_item_id, found_item_id)
);

create index if not exists matches_lost_idx on public.matches (lost_item_id);
create index if not exists matches_found_idx on public.matches (found_item_id);

-- ---------------------------------------------------------------------------
-- SAVED ITEMS
-- ---------------------------------------------------------------------------
create table if not exists public.saved_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lost_item_id uuid references public.lost_items(id) on delete cascade,
  found_item_id uuid references public.found_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, lost_item_id),
  unique (user_id, found_item_id)
);

create index if not exists saved_items_user_idx on public.saved_items (user_id);

-- ---------------------------------------------------------------------------
-- REPORT FLAGS
-- ---------------------------------------------------------------------------
create table if not exists public.report_flags (
  id uuid primary key default uuid_generate_v4(),
  item_type conversation_item_type not null,
  item_id uuid not null,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason flag_reason not null,
  details text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  unique (item_type, item_id, reporter_id)
);

create index if not exists report_flags_status_idx on public.report_flags (status, created_at);

-- ---------------------------------------------------------------------------
-- AUDIT LOGS (admin moderation actions)
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references public.profiles(id),
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_admin_idx on public.audit_logs (admin_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS POLICIES for new tables
-- ---------------------------------------------------------------------------

-- Enable RLS on all new tables
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.matches enable row level security;
alter table public.saved_items enable row level security;
alter table public.report_flags enable row level security;
alter table public.audit_logs enable row level security;

-- Conversations: only participants can read/write
drop policy if exists "conversations_participate" on public.conversations;
create policy "conversations_participate" on public.conversations for all
  using (participant_a = auth.uid() or participant_b = auth.uid());

-- Messages: only participants in the conversation can read/write
drop policy if exists "messages_conversation_participant" on public.messages;
create policy "messages_conversation_participant" on public.messages for all
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );

-- Notifications: only the owner can see them
drop policy if exists "notifications_owner" on public.notifications;
create policy "notifications_owner" on public.notifications for all
  using (user_id = auth.uid());

-- Matches: visible to the lost item reporter (owner) and admins
drop policy if exists "matches_visible_to_owner" on public.matches;
create policy "matches_visible_to_owner" on public.matches for select
  using (
    exists (select 1 from public.lost_items li where li.id = matches.lost_item_id and li.reporter_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );

drop policy if exists "matches_insert_by_engine" on public.matches;
create policy "matches_insert_by_engine" on public.matches for insert
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator'))
    or exists (select 1 from public.lost_items li where li.id = matches.lost_item_id and li.reporter_id = auth.uid())
  );

-- Saved items: only the owner can manage
drop policy if exists "saved_items_owner" on public.saved_items;
create policy "saved_items_owner" on public.saved_items for all
  using (user_id = auth.uid());

-- Report flags: users can insert and read their own; admins can read all
drop policy if exists "report_flags_user_managed" on public.report_flags;
create policy "report_flags_user_managed" on public.report_flags for all
  using (
    reporter_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );

-- Audit logs: only admins can read
drop policy if exists "audit_logs_admin_only" on public.audit_logs;
create policy "audit_logs_admin_only" on public.audit_logs for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );

-- ---------------------------------------------------------------------------
-- TRIGGER: update conversation updated_at on new message
-- ---------------------------------------------------------------------------
create or replace function public.update_conversation_on_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert
  after insert on public.messages
  for each row execute procedure public.update_conversation_on_message();

-- ---------------------------------------------------------------------------
-- TRIGGER: create notification on new message
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_new_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  other_user uuid;
begin
  select case
    when c.participant_a = new.sender_id then c.participant_b
    else c.participant_a
  end into other_user
  from public.conversations c
  where c.id = new.conversation_id;

  if other_user is not null and other_user <> new.sender_id then
    insert into public.notifications (user_id, type, title, message, link)
    values (
      other_user,
      'new_message',
      'New message',
      'You have received a new message on FindBack PH.',
      '/messages'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_new_message_notify on public.messages;
create trigger on_new_message_notify
  after insert on public.messages
  for each row execute procedure public.notify_on_new_message();
