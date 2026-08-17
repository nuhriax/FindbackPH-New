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
