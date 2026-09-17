-- ============================================================================
-- 20260918 — TEARDOWN: remove phone-OTP / government-ID verification tiers.
-- The tiered ID/phone verification didn't fit the product; keeping only:
--   - email confirmation (existing is_email_verified + badges)
--   - linked_providers chips (Google/Facebook) + sync trigger
-- Drops the ID-review table, private bucket + policies, the two lookup RPCs,
-- and the profiles verification columns. SAFE TO RE-RUN.
-- ============================================================================

drop table if exists public.identity_verifications cascade;

drop function if exists public.is_phone_verified(uuid);
drop function if exists public.is_identity_verified(uuid);

drop policy if exists "id-doc owner read" on storage.objects;
drop policy if exists "id-doc owner write" on storage.objects;
drop policy if exists "id-doc owner delete" on storage.objects;
-- Bucket itself is removed via the Storage API (storage.protect_delete
-- blocks direct SQL deletes); see the deployment note.

alter table public.profiles
  drop column if exists id_verification_status,
  drop column if exists id_verified_at;

-- Anon column grant: restore the pre-verification column list (drop the
-- added id_verification_status from the least-privilege grant).
revoke select on public.profiles from anon;
grant select (id, username, first_name, last_name, avatar_url, bio, location,
  successful_returns, created_at, linked_providers)
  on public.profiles to anon;
