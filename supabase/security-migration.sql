-- ============================================================================
-- FindBack PH — SECURITY HARDENING MIGRATION  (apply to an EXISTING database)
-- ----------------------------------------------------------------------------
-- How to use: Supabase Dashboard -> SQL Editor -> paste this -> Run.
-- Safe / idempotent: uses DROP ... IF EXISTS, so re-running is harmless.
--
-- Applies the audit fixes:
--   A. Profiles RLS      — hide role / is_suspended / is_banned from anonymous
--   B. Messages RLS      — you can only send/update/delete your OWN messages
--   C. Item-image Storage— every write scoped to the owner's folder
--
-- These changes are ALSO present in supabase/schema.sql for fresh DBs. Run this
-- file on databases created BEFORE this update; re-running is harmless.
-- ============================================================================

-- A. PROFILES — least privilege for anonymous readers ------------------------
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);

revoke select on public.profiles from anon;
grant select (id, username, first_name, last_name, avatar_url, successful_returns, location, bio, created_at, updated_at)
  on public.profiles to anon;

-- B. MESSAGES — participant read; own-only insert/update/delete ---------------
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

-- Read receipts: the app calls this RPC instead of updating another user's rows.
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

-- C. ITEM-IMAGE STORAGE — ownership-scoped writes --------------------------
-- The app uploads photos as "<user-id>/lost_<id>_<ts>_<i>.<ext>" so the storage
-- layer (not just the app) enforces that one user can never touch another's
-- files. Public SELECT is unchanged, so report photos keep rendering.
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

-- ----------------------------------------------------------------------------
-- VERIFY (optional — run AFTER the statements above)
-- ----------------------------------------------------------------------------
-- 1) Expected policies present:
--    select schemaname, tablename, policyname, cmd, roles
--    from pg_policies
--    where (schemaname = 'storage' and tablename = 'objects' and policyname ilike '%item images%')
--       or (schemaname = 'public' and tablename = 'messages')
--    order by tablename, policyname;
--
-- 2) Anonymous can NO longer read role / is_suspended / is_banned:
--    -- this should FAIL (permission denied):  select role from public.profiles;
--    -- public fields still work:              select username, avatar_url from public.profiles limit 1;
-- ============================================================================