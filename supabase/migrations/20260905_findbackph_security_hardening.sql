-- ============================================================================
-- FindBack PH — SECURITY & INTEGRITY HARDENING MIGRATION (2026-09-05)
-- ----------------------------------------------------------------------------
-- Idempotent: safe to re-run. Non-destructive: no tables dropped, no user data
-- deleted, no RLS disabled. Existing rows are never validated retroactively
-- (new CHECK constraints are NOT VALID) so this cannot fail on legacy data.
--
-- Fixes: C1 profiles privilege escalation; C2 audit_logs insert policy;
-- H1 admin moderation + protected fields; H2 matches insert/score/dismiss;
-- H3 report_flags split; M1 conversations integrity; M2 item_private_details
-- validation; M3 item_images storage_path validation; M4 notify_user_once
-- lockdown; M5 messages blocking/shape; L2-L4/L6 data checks, indexes, quotas.
-- ============================================================================

-- ============================================================================
-- C1. PROFILES — privilege escalation fix (CRITICAL)
-- Row policy profiles_update_own is correct, but default table-wide column
-- grants let a user PATCH their own row with {"role":"admin"} (or unban /
-- un-suspend themselves / forge successful_returns) via PostgREST. Revoke
-- table-level UPDATE and re-grant only the public-safe profile columns.
-- Admin writes (is_suspended) go through the service role in server actions;
-- bump_successful_returns is SECURITY DEFINER (unaffected).
-- ============================================================================
revoke update, insert, delete on public.profiles from anon, authenticated;
grant update (first_name, last_name, location, bio, avatar_url)
  on public.profiles to authenticated;

-- ============================================================================
-- C3. ITEM TABLES — least-privilege UPDATE (CRITICAL)
-- The live DB granted table-level UPDATE on lost_items/found_items to BOTH
-- anon and authenticated (Supabase default), so any visitor or member could
-- write view_count / reporter_id / created_at / search_vector directly. A bare
-- "REVOKE UPDATE (view_count)" is a no-op when only table-level grants exist,
-- so instead revoke table-level UPDATE entirely and re-grant ONLY the columns
-- the owner/moderator application code actually edits. Protected columns
-- (view_count, reporter_id, created_at, id, search_vector) are never granted.
-- SECURITY DEFINER RPCs (register_item_view / bump_successful_returns) and the
-- migration/admins-in-SQL-editor run as postgres and are unaffected.
-- ============================================================================
revoke update on public.lost_items from anon, authenticated;
grant update (title, category, description, date_lost, city, province,
              approximate_location, reward_amount, status, latitude, longitude)
  on public.lost_items to authenticated;

revoke update on public.found_items from anon, authenticated;
grant update (title, category, description, date_found, city, province,
              approximate_location, current_holding_info, status, latitude, longitude)
  on public.found_items to authenticated;

-- ============================================================================
-- C2. AUDIT LOGS — append-only trail (CRITICAL fix for broken functionality)
-- RLS had only a SELECT policy, so every logAdminAction() insert failed
-- silently. INSERT policy pins admin_id to the caller and requires an
-- admin/moderator role. No UPDATE/DELETE policy: history is immutable.
-- ============================================================================
drop policy if exists "audit_logs_admin_insert_own" on public.audit_logs;
create policy "audit_logs_admin_insert_own"
  on public.audit_logs
  for insert
  to authenticated
  with check (
    admin_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'moderator')
    )
  );

-- ============================================================================
-- H1. ADMIN MODERATION OF REPORTS (broken under RLS) + protected fields
-- ============================================================================
drop policy if exists "lost_items_admin_moderate" on public.lost_items;
create policy "lost_items_admin_moderate"
  on public.lost_items
  for update
  to authenticated
  using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );

drop policy if exists "lost_items_admin_delete" on public.lost_items;
create policy "lost_items_admin_delete"
  on public.lost_items
  for delete
  to authenticated
  using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );

drop policy if exists "found_items_admin_moderate" on public.found_items;
create policy "found_items_admin_moderate"
  on public.found_items
  for update
  to authenticated
  using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );

drop policy if exists "found_items_admin_delete" on public.found_items;
create policy "found_items_admin_delete"
  on public.found_items
  for delete
  to authenticated
  using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );

-- Protected-field guard: user sessions can never change reporter_id or
-- created_at on any report (covers the new admin policies too). Platform
-- roles (service_role / dashboard) are allowed.
create or replace function public.protect_item_core_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.reporter_id is distinct from old.reporter_id
     or new.created_at is distinct from old.created_at
  then
    if coalesce(current_setting('request.jwt.claim.role', true), current_user)
       not in ('service_role', 'postgres', 'supabase_admin')
    then
      raise exception 'reporter_id and created_at are immutable';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lost_items_protect_core on public.lost_items;
create trigger trg_lost_items_protect_core
  before update on public.lost_items
  for each row execute function public.protect_item_core_fields();

drop trigger if exists trg_found_items_protect_core on public.found_items;
create trigger trg_found_items_protect_core
  before update on public.found_items
  for each row execute function public.protect_item_core_fields();

-- ============================================================================
-- H2. MATCHES — the matching engine could never insert (HIGH)
-- matches_insert_by_engine required an admin role, but the engine runs as the
-- report OWNER, so every match insert was rejected. The lost item's reporter
-- may now create matches for their own lost report; score bounded 0..100;
-- users may only flip "dismissed" (column-level grant) — never score/pair.
-- ============================================================================
drop policy if exists "matches_insert_by_engine" on public.matches;
create policy "matches_insert_by_engine"
  on public.matches
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.lost_items li
      where li.id = lost_item_id and li.reporter_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'moderator')
    )
  );

revoke update on public.matches from anon, authenticated;
grant update (dismissed) on public.matches to authenticated;

drop policy if exists "matches_owner_dismiss" on public.matches;
create policy "matches_owner_dismiss"
  on public.matches
  for update
  to authenticated
  using (
    exists (
      select 1 from public.lost_items li
      where li.id = lost_item_id and li.reporter_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'moderator')
    )
  );

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'matches_score_range'
  ) then
    alter table public.matches
      add constraint matches_score_range
      check (score is null or (score >= 0 and score <= 100)) not valid;
  end if;
end $$;

-- ============================================================================
-- H3. REPORT FLAGS — reporters could edit / erase their own flags (HIGH)
-- report_flags_user_managed was FOR ALL: the reporter could set status,
-- forge reviewed_at / reviewed_by, or delete their flag. Split into
-- insert-own / select-own-or-moderator / update-moderator-only. No delete.
-- ============================================================================
drop policy if exists "report_flags_user_managed" on public.report_flags;

drop policy if exists "report_flags_insert_own" on public.report_flags;
create policy "report_flags_insert_own"
  on public.report_flags
  for insert
  to authenticated
  with check (reporter_id = auth.uid());

drop policy if exists "report_flags_select_own_or_admin" on public.report_flags;
create policy "report_flags_select_own_or_admin"
  on public.report_flags
  for select
  to authenticated
  using (
    reporter_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'moderator')
    )
  );

drop policy if exists "report_flags_moderator_update" on public.report_flags;
create policy "report_flags_moderator_update"
  on public.report_flags
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'moderator')
    )
  );

-- ============================================================================
-- M4. NOTIFY_USER_ONCE — notifications can no longer be forged by users
-- The SECURITY DEFINER writer was executable by any authenticated user via
-- PostgREST. Server code uses the service role (src/lib/notify.ts); internal
-- trigger/RPC calls are unaffected.
-- ============================================================================
revoke execute on function public.notify_user_once(uuid, text, text, text, text)
  from PUBLIC, anon, authenticated;
grant execute on function public.notify_user_once(uuid, text, text, text, text)
  to service_role;

-- Defense-in-depth: remove remaining SECURITY DEFINER RPCs from the
-- anonymous surface (they already fail closed for anonymous callers).
revoke execute on function public.mark_messages_read(uuid) from PUBLIC, anon;
grant execute on function public.mark_messages_read(uuid) to authenticated;

revoke execute on function public.verify_ownership_answers(text, uuid, text, text)
  from PUBLIC, anon;
grant execute on function public.verify_ownership_answers(text, uuid, text, text)
  to authenticated, service_role;

revoke execute on function public.get_ownership_challenge(text, uuid)
  from PUBLIC, anon;
grant execute on function public.get_ownership_challenge(text, uuid)
  to authenticated;

revoke execute on function public.get_item_viewers(text, text) from PUBLIC, anon;
grant execute on function public.get_item_viewers(text, text) to authenticated;

-- ============================================================================
-- M1. CONVERSATIONS — integrity (HIGH)
-- 1. participant_a must sort before participant_b (app always inserts that
--    way): blocks self-conversations and swapped-pair duplicates. NOT VALID
--    leaves legacy rows untouched; all new rows are validated.
-- 2. Insert policy requires the referenced item to exist and be ACTIVE.
-- ============================================================================
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'conversations_ordered_participants'
  ) then
    alter table public.conversations
      add constraint conversations_ordered_participants
      check (participant_a < participant_b) not valid;
  end if;
end $$;

drop policy if exists "conversations_participate" on public.conversations;

drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant"
  on public.conversations
  for select
  to authenticated
  using (participant_a = auth.uid() or participant_b = auth.uid());

drop policy if exists "conversations_insert_participant" on public.conversations;
create policy "conversations_insert_participant"
  on public.conversations
  for insert
  to authenticated
  with check (
    (participant_a = auth.uid() or participant_b = auth.uid())
    and exists (
      select 1 from public.lost_items li
      where li.id = item_id and item_type = 'lost_item' and li.status = 'active'
    )
    and exists (
      select 1 from public.found_items fi
      where fi.id = item_id and item_type = 'found_item' and fi.status = 'active'
    )
  );

drop policy if exists "conversations_update_participant" on public.conversations;
create policy "conversations_update_participant"
  on public.conversations
  for update
  to authenticated
  using (participant_a = auth.uid() or participant_b = auth.uid())
  with check (participant_a = auth.uid() or participant_b = auth.uid());

drop policy if exists "conversations_delete_participant" on public.conversations;
create policy "conversations_delete_participant"
  on public.conversations
  for delete
  to authenticated
  using (participant_a = auth.uid() or participant_b = auth.uid());

-- ============================================================================
-- M5. MESSAGES — DB-enforced blocking + shape validation (HIGH)
-- Blocking was only checked in server actions; a valid session could post
-- into a conversation between blocked accounts via direct API calls.
-- ============================================================================
drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own"
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
    and not exists (
      select 1
      from public.conversations c2
      join public.blocked_users b
        on (b.blocker_id = c2.participant_a and b.blocked_id = c2.participant_b)
        or (b.blocker_id = c2.participant_b and b.blocked_id = c2.participant_a)
      where c2.id = conversation_id
    )
  );

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'messages_audio_url_required'
  ) then
    alter table public.messages
      add constraint messages_audio_url_required
      check (kind <> 'audio' or audio_url is not null) not valid;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'messages_body_len'
  ) then
    alter table public.messages
      add constraint messages_body_len
      check (char_length(body) <= 5000) not valid;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'messages_audio_duration_range'
  ) then
    alter table public.messages
      add constraint messages_audio_duration_range
      check (audio_duration is null or audio_duration between 1 and 3600) not valid;
  end if;
end $$;

-- ============================================================================
-- M2. ITEM PRIVATE DETAILS — must belong to the item's reporter (HIGH)
-- reporter_id was self-declared: a user could attach private details to ANY
-- item id and poison the service-role matching input for that report.
-- ============================================================================
create or replace function public.validate_item_private_details()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_reporter uuid;
begin
  if new.item_type = 'lost_item' then
    select reporter_id into v_reporter
      from public.lost_items where id = new.item_id;
  elsif new.item_type = 'found_item' then
    select reporter_id into v_reporter
      from public.found_items where id = new.item_id;
  else
    raise exception 'item_private_details: invalid item_type';
  end if;

  if v_reporter is null then
    raise exception 'item_private_details: unknown item %', new.item_id;
  end if;
  if v_reporter <> new.reporter_id then
    raise exception 'item_private_details: only the item''s reporter may attach details';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_item_private_details_validate
  on public.item_private_details;
create trigger trg_item_private_details_validate
  before insert or update on public.item_private_details
  for each row execute function public.validate_item_private_details();

-- ============================================================================
-- M3. ITEM IMAGES — storage_path must live in the reporter's own folder (HIGH)
-- storage_path was unvalidated: a reporter could attach another user's Storage
-- object to their own item row. Also: one row per (item, position).
-- ============================================================================
create or replace function public.validate_item_image()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_reporter uuid;
begin
  if new.lost_item_id is not null then
    select reporter_id into v_reporter
      from public.lost_items where id = new.lost_item_id;
  elsif new.found_item_id is not null then
    select reporter_id into v_reporter
      from public.found_items where id = new.found_item_id;
  else
    raise exception 'item_images: missing parent item';
  end if;

  if v_reporter is null then
    raise exception 'item_images: unknown parent item';
  end if;
  if coalesce((storage.foldername(new.storage_path))[1], '') <> v_reporter::text then
    raise exception 'item_images: storage_path must be inside the reporter''s own folder';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_item_images_validate on public.item_images;
create trigger trg_item_images_validate
  before insert or update of storage_path, lost_item_id, found_item_id
  on public.item_images
  for each row execute function public.validate_item_image();

-- One image per position per item. If legacy rows contain duplicate positions
-- the index creation is skipped (unique_violation swallowed) — never fail.
do $$ begin
  create unique index if not exists item_images_lost_position_uidx
    on public.item_images (lost_item_id, position)
    where lost_item_id is not null;
exception when unique_violation then null; end $$;

do $$ begin
  create unique index if not exists item_images_found_position_uidx
    on public.item_images (found_item_id, position)
    where found_item_id is not null;
exception when unique_violation then null; end $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'item_images_phash_format'
  ) then
    -- The live schema predates the phash column; add it idempotently (the
    -- app already sends hashes and tolerates its absence via nullable use).
    alter table public.item_images add column if not exists phash text;
    alter table public.item_images
      add constraint item_images_phash_format
      check (phash is null or phash ~ '^[0-9a-fA-F]{16}$') not valid;
  end if;
end $$;

-- ============================================================================
-- HIGH — ROGUE AVATAR STORAGE POLICIES (found live, hash-named policies)
-- "Public avatar <hash>_0/_2/_3" grant INSERT/UPDATE/DELETE on the avatars
-- bucket to role PUBLIC with only a bucket check and NO owner scoping, so any
-- anonymous visitor could overwrite or delete any member's profile photo.
-- These duplicates of the properly-scoped "Avatar insert/update/delete own"
-- policies are removed. SELECT (public read) policies are kept untouched.
-- ============================================================================
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname like 'Public avatar %'
      and cmd in ('INSERT', 'UPDATE', 'DELETE')
  loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end $$;


-- ============================================================================
-- L2. SAVED ITEMS — exactly one of lost_item_id / found_item_id (LOW)
-- ============================================================================
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'saved_items_one_item'
  ) then
    alter table public.saved_items
      add constraint saved_items_one_item
      check ((lost_item_id is null) <> (found_item_id is null)) not valid;
  end if;
end $$;

-- Missing FK-supporting indexes (cascade deletes / reverse lookups)
create index if not exists saved_items_lost_idx on public.saved_items (lost_item_id);
create index if not exists saved_items_found_idx on public.saved_items (found_item_id);

-- ============================================================================
-- L3. REPORT DATA VALIDATION — Philippines-only & sane values (LOW)
-- NOT VALID: enforced for all NEW writes (app already guarantees them);
-- legacy rows are never re-validated, so the migration cannot fail.
-- ============================================================================
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'lost_items_reward_nonneg'
  ) then
    alter table public.lost_items
      add constraint lost_items_reward_nonneg
      check (reward_amount >= 0) not valid;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'lost_items_ph_coords'
  ) then
    alter table public.lost_items
      add constraint lost_items_ph_coords
      check ((latitude between 3.5 and 21.5) and (longitude between 113.0 and 128.5)) not valid;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'lost_items_view_count_nonneg'
  ) then
    alter table public.lost_items
      add constraint lost_items_view_count_nonneg
      check (view_count >= 0) not valid;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'found_items_ph_coords'
  ) then
    alter table public.found_items
      add constraint found_items_ph_coords
      check ((latitude between 3.5 and 21.5) and (longitude between 113.0 and 128.5)) not valid;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'found_items_view_count_nonneg'
  ) then
    alter table public.found_items
      add constraint found_items_view_count_nonneg
      check (view_count >= 0) not valid;
  end if;
end $$;

-- ============================================================================
-- L4. CONTACT MESSAGES — bounded enquiry payloads (LOW)
-- ============================================================================
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'contact_messages_limits'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_limits
      check (
        char_length(name) <= 100
        and char_length(email) <= 254
        and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
        and char_length(subject) <= 200
        and char_length(message) <= 5000
      ) not valid;
  end if;
end $$;

-- ============================================================================
-- L6. STORAGE BUCKET QUOTAS (LOW) — server-side size caps matching the app's
-- client-side validation. MIME allow-lists only for buckets whose upload
-- paths validate exact types (item-images, avatars); chat media keeps a NULL
-- allow-list because browsers report codec-parameterized content types
-- (e.g. "audio/webm;codecs=opus") that an allow-list would reject.
-- ============================================================================
update storage.buckets
   set file_size_limit = 5242880,   -- 5 MB (app limit)
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
 where id = 'item-images';

update storage.buckets
   set file_size_limit = 4194304,   -- 4 MB (app limit)
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
 where id = 'avatars';

update storage.buckets
   set file_size_limit = 15728640   -- 15 MB (app limit)
 where id = 'chat-images';

update storage.buckets
   set file_size_limit = 15728640   -- 15 MB (app limit)
 where id = 'voice-messages';

update storage.buckets
   set file_size_limit = 26214400   -- 25 MB (app limit 20 MB + headroom)
 where id = 'chat-videos';

-- ============================================================================
-- END — verify with supabase/security-verification-checklist.sql plus the
-- policy/constraint queries in the audit report.
-- ============================================================================




