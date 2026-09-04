-- ============================================================================
-- 110 — TRUST, SAFETY & ANTI-FRAUD HARDENING
--
-- Three changes:
--   A. item_private_details  — private verification details move OUT of the
--      publicly-readable lost_items/found_items rows into an owner-only table
--      (RLS: reporter-only). Existing values are copied in and nulled out of
--      the public tables. The server-side matching engine reads this table
--      through the service-role key (server-only operation).
--   B. return_confirmations  — both sides of a handover can confirm a
--      successful return (the reporter AND the other conversation party).
--   C. claim_attempts        — every ownership-challenge attempt is logged per
--      user; the verify RPC restricts claiming after repeated failures
--      (30-day window) and for suspended accounts.
--
-- Safe to re-run. Run in the Supabase SQL editor AFTER 109.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- A. PRIVATE VERIFICATION DETAILS
-- ----------------------------------------------------------------------------
create table if not exists public.item_private_details (
  item_type text not null check (item_type in ('lost_item', 'found_item')),
  item_id uuid not null,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (item_type, item_id)
);

alter table public.item_private_details enable row level security;

-- Owner-only: insert/read/update/delete their own private details.
-- anon gets nothing (Supabase grants new tables to anon by default — revoke).
drop policy if exists "Owner manages private details" on public.item_private_details;
create policy "Owner manages private details"
  on public.item_private_details
  for all
  to authenticated
  using (reporter_id = auth.uid())
  with check (reporter_id = auth.uid());

revoke all on public.item_private_details from anon, authenticated;
grant select, insert, update, delete on public.item_private_details to authenticated;

-- Copy any existing public private details into the private table, then scrub
-- the public columns so the data exists in exactly one (protected) place.
insert into public.item_private_details (item_type, item_id, reporter_id, details)
select 'lost_item', id, reporter_id, distinguishing_features
from public.lost_items
where distinguishing_features is not null
on conflict (item_type, item_id) do update
  set details = excluded.details, updated_at = now();

insert into public.item_private_details (item_type, item_id, reporter_id, details)
select 'found_item', id, reporter_id, distinguishing_features
from public.found_items
where distinguishing_features is not null
on conflict (item_type, item_id) do update
  set details = excluded.details, updated_at = now();

update public.lost_items set distinguishing_features = null where distinguishing_features is not null;
update public.found_items set distinguishing_features = null where distinguishing_features is not null;

-- ----------------------------------------------------------------------------
-- B. TWO-SIDED RETURN CONFIRMATION
-- ----------------------------------------------------------------------------
create table if not exists public.return_confirmations (
  id uuid primary key default uuid_generate_v4(),
  item_type text not null check (item_type in ('lost_item', 'found_item')),
  item_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  note text check (char_length(note) <= 300),
  created_at timestamptz not null default now(),
  unique (item_type, item_id, user_id)
);

alter table public.return_confirmations enable row level security;

drop policy if exists "Participants confirm returns" on public.return_confirmations;
create policy "Participants confirm returns"
  on public.return_confirmations
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and (
      exists (select 1 from public.lost_items li where li.id = item_id and li.reporter_id = auth.uid())
      or exists (select 1 from public.found_items fi where fi.id = item_id and fi.reporter_id = auth.uid())
      or exists (
        select 1 from public.conversations c
        where c.item_type = item_type
          and c.item_id = item_id
          and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
      )
    )
  );

drop policy if exists "Participants view return confirmations" on public.return_confirmations;
create policy "Participants view return confirmations"
  on public.return_confirmations
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.lost_items li where li.id = item_id and li.reporter_id = auth.uid())
    or exists (select 1 from public.found_items fi where fi.id = item_id and fi.reporter_id = auth.uid())
    or exists (
      select 1 from public.conversations c
      where c.item_type = item_type
        and c.item_id = item_id
        and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );

revoke all on public.return_confirmations from anon, authenticated;
grant select, insert on public.return_confirmations to authenticated;

-- ----------------------------------------------------------------------------
-- C. CLAIM ATTEMPT LOG (written by the security-definer RPC only)
-- ----------------------------------------------------------------------------
create table if not exists public.claim_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null,
  item_id uuid not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists claim_attempts_user_idx on public.claim_attempts (user_id, created_at);

alter table public.claim_attempts enable row level security;

-- Attempts are written by the verify RPC only. No client access at all.
revoke all on public.claim_attempts from anon, authenticated;
