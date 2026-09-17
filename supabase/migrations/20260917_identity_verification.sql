-- ============================================================================
-- 115 — IDENTITY VERIFICATION (Phase 8)
--
-- Three trust tiers, backed only by REAL signals:
--   1. Contact verified   — email (existing is_email_verified) / phone OTP.
--      Phone verification is read from auth.users.phone_confirmed_at (set by
--      Supabase Auth when the SMS OTP succeeds — enable the "Phone" provider
--      in the Supabase dashboard to activate; nothing here hard-depends on it).
--   2. Linked identity    — OAuth provider chips, derived client-side from
--      user.identities (no schema needed).
--   3. ID verified        — the user VOLUNTARILY uploads a government ID into
--      the PRIVATE id-documents bucket; an admin reviews and approves.
--
-- Data Privacy Act notes:
--   - Documents live in a PRIVATE bucket; only the owner's folder is
--     reachable, and only via owner-authenticated storage RLS. No public URL
--     can ever be formed. Admin review reads through the service role with a
--     short-lived signed URL.
--   - The identity_verifications table stores NO extracted ID data — just
--     doc type, storage path, and review state.
--   - Erasure: account deletion removes the user's folder (cleanupUserStorage
--     includes the bucket) and rows cascade with the profile.
-- Run in the Supabase SQL Editor. Safe to re-run.
-- ============================================================================

-- 1) PROFILES — verification state (admin/service-role writes only) -----------
alter table public.profiles
  add column if not exists id_verification_status text not null default 'none'
    check (id_verification_status in ('none','pending','approved','rejected')),
  add column if not exists id_verified_at timestamptz;

-- 2) IDENTITY VERIFICATIONS — one row per submitted document review -----------
create table if not exists public.identity_verifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  doc_type text not null
    check (doc_type in ('philsys','drivers_license','passport','umid','voters_id')),
  storage_path text not null,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  consent_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create index if not exists identity_verifications_user_idx
  on public.identity_verifications (user_id);
create index if not exists identity_verifications_pending_idx
  on public.identity_verifications (created_at) where status = 'pending';

alter table public.identity_verifications enable row level security;

-- Owner sees their own submission history and files new ones. No update path
-- for users — review state changes flow exclusively through the service role.
drop policy if exists "iv owner select" on public.identity_verifications;
create policy "iv owner select"
  on public.identity_verifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "iv owner insert" on public.identity_verifications;
create policy "iv owner insert"
  on public.identity_verifications for insert to authenticated
  with check (user_id = auth.uid());

-- 3) PRIVATE STORAGE BUCKET — id-documents ------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'id-documents', 'id-documents', false, 5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "id-doc owner read" on storage.objects;
create policy "id-doc owner read"
  on storage.objects for select to authenticated
  using (bucket_id = 'id-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "id-doc owner write" on storage.objects;
create policy "id-doc owner write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'id-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "id-doc owner delete" on storage.objects;
create policy "id-doc owner delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'id-documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- 4) LOOKUP RPCs — same shape as is_email_verified (boolean only, no PII) -----
create or replace function public.is_phone_verified(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from auth.users u
    where u.id = p_uid and u.phone_confirmed_at is not null
  );
$$;

create or replace function public.is_identity_verified(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_uid and p.id_verification_status = 'approved'
  );
$$;

grant execute on function public.is_phone_verified(uuid) to authenticated, anon;
grant execute on function public.is_identity_verified(uuid) to authenticated, anon;

-- 5) LINKED PROVIDERS — how the account is backed (Google / Facebook / email)
-- Mirrored from auth.users by trigger, so profiles alone answer "which
-- providers back this identity" WITHOUT exposing auth data or needing the
-- admin API (which an anon-key server client cannot call).
alter table public.profiles
  add column if not exists linked_providers text[] not null default '{}';

create or replace function public.sync_linked_providers()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_providers text[];
begin
  select coalesce(
    array(select jsonb_array_elements_text(
      coalesce(new.raw_app_meta_data->'providers', '[]'::jsonb)
    )),
    '{}'
  ) into v_providers;

  update public.profiles p
     set linked_providers = v_providers,
         updated_at = now()
   where p.id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_provider_sync on auth.users;
create trigger on_auth_user_provider_sync
  after update of raw_app_meta_data, last_sign_in_at on auth.users
  for each row execute procedure public.sync_linked_providers();

-- Backfill existing members.
update public.profiles p
   set linked_providers = coalesce(
     (select array(
        select jsonb_array_elements_text(
          coalesce(u.raw_app_meta_data->'providers', '[]'::jsonb)
        ))
        from auth.users u where u.id = p.id),
     '{}')
 where p.linked_providers = '{}';

-- Anonymous visitors keep least privilege on the new columns (mirrors the
-- hardening migration's profiles rules).
revoke select on public.profiles from anon;
grant select (id, username, first_name, last_name, avatar_url, bio, location,
  successful_returns, created_at, id_verification_status, linked_providers)
  on public.profiles to anon;
