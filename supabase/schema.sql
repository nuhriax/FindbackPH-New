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
  -- Optional "pin exact location" coordinates from the report wizard's
  -- Philippines-only map picker. Nullable; only stored as a pair.
  latitude double precision,
  longitude double precision,
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
  -- Optional "pin exact location" coordinates (see lost_items).
  latitude double precision,
  longitude double precision,
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

-- Least privilege for anonymous visitors: they may read the public-safe columns
-- only. Sensitive fields (role, is_suspended, is_banned) are revoked from the
-- `anon` role so an unauthenticated request can never read them. Authenticated
-- sessions (including admin/moderation server code) keep full access.
revoke select on public.profiles from anon;
grant select (id, username, first_name, last_name, avatar_url, successful_returns, location, bio, created_at, updated_at)
  on public.profiles to anon;

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

-- Messages: participants can read their conversation; a user may only send,
-- update or delete their OWN messages.
drop policy if exists "messages_conversation_participant" on public.messages;
drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant" on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );

drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own" on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );

drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own" on public.messages for update
  to authenticated
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

drop policy if exists "messages_delete_own" on public.messages;
create policy "messages_delete_own" on public.messages for delete
  to authenticated
  using (sender_id = auth.uid());

-- Read receipts: a participant surfaces read_by_receiver on messages SENT BY the
-- OTHER party. Because the UPDATE policy only allows editing your own rows, this
-- goes through a security-definer RPC that verifies participation and only
-- flips read_by_receiver on the counterparty's messages (never body/sender_id).
drop function if exists public.mark_messages_read(uuid);
create function public.mark_messages_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then
    return;
  end if;
  if not exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id
      and (c.participant_a = v_caller or c.participant_b = v_caller)
  ) then
    return;
  end if;
  update public.messages
     set read_by_receiver = true
   where conversation_id = p_conversation_id
     and sender_id <> v_caller;
end;
$$;

grant execute on function public.mark_messages_read(uuid) to authenticated;

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

-- ============================================================================
-- PROFILE EXTENSIONS (location + bio) — optional profile fields
-- ============================================================================
alter table public.profiles add column if not exists location text;
alter table public.profiles add column if not exists bio text;

-- ============================================================================
-- CONTACT MESSAGES — user / visitor enquiries
-- ============================================================================
create table if not exists public.contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_status_idx on public.contact_messages (status, created_at);
create index if not exists contact_messages_user_idx on public.contact_messages (user_id);

alter table public.contact_messages enable row level security;

-- Anyone (signed in or not) may submit an enquiry.
create policy "Allow public insert on contact_messages"
  on public.contact_messages for insert
  with check (true);

-- Only admins / moderators can view enquiries (no private data leaks publicly).
create policy "Admins can read contact_messages"
  on public.contact_messages for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );

-- ============================================================================
-- AVATAR STORAGE POLICIES — profile photos
-- ----------------------------------------------------------------------------
-- The front-end uploads profile photos to the public "avatars" Storage bucket
-- (see src/lib/actions/profile.ts). The bucket is created here (as PUBLIC) so
-- you don't need to click through the Storage UI — just run this file in the
-- SQL Editor. These policies let anyone read avatars (so they render on
-- reports/conversations) while each signed-in user can only INSERT / UPDATE /
-- DELETE their own file, which the app stores at the path "<user_id>.<ext>".
-- ----------------------------------------------------------------------------
-- Create the public "avatars" bucket. Safe to re-run (ignores if it exists).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Note: storage.objects is owned by the `storage` schema. When running the
-- whole schema.sql via the SQL editor as a project owner it works, but these
-- statements must be run against the "storage" schema (they are NOT inside the
-- `public` schema), so this block runs standalone at the end.
drop policy if exists "Public avatar read" on storage.objects;
create policy "Public avatar read"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

drop policy if exists "Avatar insert own" on storage.objects;
create policy "Avatar insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Avatar update own" on storage.objects;
create policy "Avatar update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Avatar delete own" on storage.objects;
create policy "Avatar delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- ITEM IMAGE STORAGE POLICIES — report photos
-- ----------------------------------------------------------------------------
-- Report photos are uploaded to the public "item-images" Storage bucket by the
-- app (see /api/item-images). The bucket is created here (as PUBLIC) so it
-- exists automatically when this file is run in the SQL Editor.
--
-- Policy notes:
--   * Public SELECT lets report photos render anywhere on the site.
--   * INSERT / UPDATE / DELETE require the object's first path folder to equal
--     the authenticated user's id (same pattern as the avatars bucket). The app
--     writes photo paths as "<user-id>/lost_<itemId>_<ts>_<i>.<ext>", so the
--     Storage bucket scopes every write to its owner — one user can never
--     overwrite or delete another user's files. The /api/item-images route
--     handler additionally confirms the signed-in user owns that report before
--     attaching photos, and records the files in public.item_images (RLS keeps
--     every row tied to the correct lost/found item).
-- ----------------------------------------------------------------------------
-- Create the public "item-images" bucket. Safe to re-run (ignores if it exists).
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

drop policy if exists "Public item image read" on storage.objects;
create policy "Public item image read"
  on storage.objects for select
  to public
  using (bucket_id = 'item-images');

drop policy if exists "Authenticated can insert item images" on storage.objects;
create policy "Authenticated can insert item images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Authenticated can update item images" on storage.objects;
create policy "Authenticated can update item images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Authenticated can delete item images" on storage.objects;
create policy "Authenticated can delete item images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- REALTIME REPLICATION
-- ----------------------------------------------------------------------------
-- The front-end uses Supabase Realtime (postgres_changes subscriptions) to
-- auto-refresh the homepage report grid and the live message threads whenever
-- something changes in the database. For those subscriptions to actually fire,
-- the tables must be members of the default `supabase_realtime` publication.
-- By default NO table is replicated, so without this block you won't get any
-- live updates even though the React components are subscribed.
--
-- Tables added here:
--   lost_items / found_items  -> live homepage recent-reports grid (+ item pages)
--   messages                  -> live chat threads
--   conversations            -> conversation list ordering / preview
--   notifications            -> (reusable) for a future live notification badge
--
-- Safe to re-run: membership is checked before adding, so running this whole
-- schema.sql again (or just this block) will not error out.
-- ============================================================================

-- Helper: add a table to the Realtime publication if it exists and isn't a
-- member yet. Deleted at the end so it doesn't linger in the schema.
create or replace function public.enable_realtime(_table text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = _table
     ) then
    execute format('alter publication supabase_realtime add table public.%I', _table);
  end if;
end;
$$;

select public.enable_realtime('lost_items');
select public.enable_realtime('found_items');
select public.enable_realtime('messages');
select public.enable_realtime('conversations');
select public.enable_realtime('notifications');

drop function if exists public.enable_realtime(text);

-- ============================================================================
-- PHASE 11 — NOTIFICATIONS & ACTIVITY
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Dedupe-safe notification insert.
-- Every server-side notification writer (matching engine, recovery flow,
-- moderation actions, ownership verification) goes through this security-
-- definer RPC so a user can never receive two identical UNREAD notifications.
-- SECURITY: `security definer` is intentional — it bypasses the notifications
-- RLS policy so the SYSTEM may write to any user's notification feed. It only
-- ever inserts into `public.notifications` and never reads private data.
-- Safe to re-run.
-- ----------------------------------------------------------------------------
create or replace function public.notify_user_once(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_link text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return;
  end if;

  -- Skip when an identical unread notification already exists for this user.
  if exists (
    select 1
    from public.notifications n
    where n.user_id = p_user_id
      and n.type = p_type::notification_type
      and n.title = p_title
      and coalesce(n.link, '') = coalesce(p_link, '')
      and n.read = false
  ) then
    return;
  end if;

  insert into public.notifications (user_id, type, title, message, link)
  values (p_user_id, p_type::notification_type, p_title, p_message, p_link);
end;
$$;

-- ----------------------------------------------------------------------------
-- New-message trigger now uses the dedupe-safe writer so a burst of messages
-- in one conversation produces ONE unread "New message" notification, not one
-- per message. Once the user reads it, the next message notifies again.
-- ----------------------------------------------------------------------------
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
    perform public.notify_user_once(
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

-- ============================================================================
-- PHASE 12 — MODERATION & ABUSE REPORTING
-- ============================================================================

-- NOTE: `alter type flag_reason add value if not exists 'impersonation';`
-- must run in a SEPARATE transaction before the statements below (Postgres
-- does not allow using a newly-added enum value in the same transaction).
-- It is applied out-of-band when this file is deployed; kept here as a comment
-- so fresh databases can order it correctly.

-- ---------------------------------------------------------------------------
-- USER FLAGS — report another user's behaviour to the moderation team
-- ---------------------------------------------------------------------------
create table if not exists public.user_flags (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  reason flag_reason not null,
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'pending'
    check (status in ('pending', 'under_review', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  unique (reporter_id, target_user_id)
);

create index if not exists user_flags_status_idx on public.user_flags (status, created_at);
create index if not exists user_flags_target_idx on public.user_flags (target_user_id);

alter table public.user_flags enable row level security;

-- Users may file and read their own reports; admins/moderators read all.
drop policy if exists "user_flags_insert_own" on public.user_flags;
create policy "user_flags_insert_own" on public.user_flags for insert
  to authenticated
  with check (
    reporter_id = auth.uid()
    and target_user_id <> auth.uid()
  );

drop policy if exists "user_flags_select_own_or_admin" on public.user_flags;
create policy "user_flags_select_own_or_admin" on public.user_flags for select
  to authenticated
  using (
    reporter_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );

-- Only moderators may change review state (enforced again server-side).
drop policy if exists "user_flags_moderator_update" on public.user_flags;
create policy "user_flags_moderator_update" on public.user_flags for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );

-- ---------------------------------------------------------------------------
-- BLOCKED USERS — one-sided mute/block between members
-- ---------------------------------------------------------------------------
create table if not exists public.blocked_users (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocked_users enable row level security;

drop policy if exists "blocked_users_owner" on public.blocked_users;
create policy "blocked_users_owner" on public.blocked_users for all
  to authenticated
  using (blocker_id = auth.uid())
  with check (blocker_id = auth.uid() and blocked_id <> auth.uid());
