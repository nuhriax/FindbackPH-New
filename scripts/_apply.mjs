// Approved security changes via Supabase Management API. Nothing else.
// Areas (only these four): profiles anon columns, messages RLS,
// mark_messages_read RPC + grant, item-images storage INSERT/UPDATE/DELETE.
import { run } from "./_mgmt.mjs";

const STATEMENTS = [];

// ---- A. PROFILES — least privilege for anonymous readers ------------------
STATEMENTS.push(
  ["A1. drop old profiles select policy",
   `drop policy if exists "profiles_select_all" on public.profiles;`],
  ["A2. recreate profiles select policy (unchanged semantics)",
   `create policy "profiles_select_all" on public.profiles for select using (true);`],
  ["A3. revoke full-row SELECT from anonymous role",
   `revoke select on public.profiles from anon;`],
  ["A4. grant only public-safe columns to anon (role/is_suspended/is_banned excluded)",
   `grant select (id, username, first_name, last_name, avatar_url, successful_returns, location, bio, created_at, updated_at) on public.profiles to anon;`]
);

// ---- B. MESSAGES — participant-scoped RLS ---------------------------------
STATEMENTS.push(
  ["B1. drop old broad FOR ALL messages policy",
   `drop policy if exists "messages_conversation_participant" on public.messages;`],
  ["B2. SELECT: participants can read their conversations' messages",
   `create policy "messages_select_participant" on public.messages for select
    to authenticated
    using (exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    ));`],
  ["B3. INSERT: only own sender_id inside own conversation",
   `create policy "messages_insert_own" on public.messages for insert
    to authenticated
    with check (sender_id = auth.uid() and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    ));`],
  ["B4. UPDATE: only your own messages",
   `create policy "messages_update_own" on public.messages for update
    to authenticated
    using (sender_id = auth.uid())
    with check (sender_id = auth.uid());`],
  ["B5. DELETE: only your own messages",
   `create policy "messages_delete_own" on public.messages for delete
    to authenticated
    using (sender_id = auth.uid());`]
);

// ---- B (cont). mark_messages_read RPC + grant ------------------------------
STATEMENTS.push(
  ["B6. drop RPC if re-applying (idempotent)",
   `drop function if exists public.mark_messages_read(uuid);`],
  ["B7. create mark_messages_read RPC (read receipts)",
   String.raw`create function public.mark_messages_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then
    return;
  end if;

  -- Only participants may act, and only within that conversation.
  if not exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id
      and (c.participant_a = v_caller or c.participant_b = v_caller)
  ) then
    return;
  end if;

  -- Flip ONLY the counterparty's read flag. Never touches body/sender_id.
  update public.messages
     set read_by_receiver = true
   where conversation_id = p_conversation_id
     and sender_id <> v_caller;
end;
$fn$;`],
  ["B8. allow authenticated users to EXECUTE the RPC",
   `grant execute on function public.mark_messages_read(uuid) to authenticated;`]
);

// ---- C. ITEM-IMAGES STORAGE — ownership-scoped writes ----------------------
STATEMENTS.push(
  ["C1. drop open INSERT policy",
   `drop policy if exists "Authenticated can insert item images" on storage.objects;`],
  ["C2. recreate INSERT: owner's folder only",
   `create policy "Authenticated can insert item images"
    on storage.objects for insert
    to authenticated
    with check (
      bucket_id = 'item-images'
      and (storage.foldername(name))[1] = auth.uid()::text
    );`],
  ["C3. drop open UPDATE policy",
   `drop policy if exists "Authenticated can update item images" on storage.objects;`],
  ["C4. recreate UPDATE: owner's folder only",
   `create policy "Authenticated can update item images"
    on storage.objects for update
    to authenticated
    using (
      bucket_id = 'item-images'
      and (storage.foldername(name))[1] = auth.uid()::text
    )
    with check (
      bucket_id = 'item-images'
      and (storage.foldername(name))[1] = auth.uid()::text
    );`],
  ["C5. drop open DELETE policy",
   `drop policy if exists "Authenticated can delete item images" on storage.objects;`],
  ["C6. recreate DELETE: owner's folder only",
   `create policy "Authenticated can delete item images"
    on storage.objects for delete
    to authenticated
    using (
      bucket_id = 'item-images'
      and (storage.foldername(name))[1] = auth.uid()::text
    );`]
);

// ---- Execute every statement; stop at first failure ------------------------
for (const [label, sql] of STATEMENTS) {
  await run(label, sql);
}

// ---- Read-only verification -------------------------------------------------
await run("VERIFY-1. policies on profiles/messages", `
  select tablename, policyname, cmd, roles
  from pg_policies
  where schemaname = 'public'
    and tablename in ('profiles', 'messages')
  order by tablename, policyname;`);

await run("VERIFY-2. anon column grants on profiles", `
  select column_name, privilege_type
  from information_schema.column_privileges
  where table_schema = 'public' and table_name = 'profiles'
    and grantee = 'anon'
  order by column_name;`);

await run("VERIFY-3. mark_messages_read present + execute privs", `
  select p.proname, pg_get_function_arguments(p.oid) as args,
         has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_exec,
         has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec
  from pg_proc p where p.proname = 'mark_messages_read';`);

await run("VERIFY-4. item-images write policies", `
  select policyname, cmd, roles, with_check, qual
  from pg_policies
  where schemaname = 'storage' and tablename = 'objects'
    and policyname like '%item images%'
  order by policyname;`);

console.log("\nDONE — all approved statements applied and verified.");
