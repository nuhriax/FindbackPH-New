/**
 * Read-only inspection of the live Supabase project: profiles/messages/storage
 * RLS + column grants + RPC presence. Does NOT modify anything.
 */
import { run } from "./_mgmt.mjs";

// 1. Profiles RLS policies
await run("profiles RLS policies", `
  select policyname, cmd, roles::text,
         qual::text as using,
         with_check::text as with_check
  from pg_policies where schemaname='public' and tablename='profiles'
  order by cmd, policyname;
`);

// 2. Profiles column grants to anon (which public columns can anon read?)
await run("profiles column grants to anon", `
  select column_name, privilege_type
  from information_schema.role_column_grants
  where table_schema='public' and table_name='profiles' and grantee='anon'
  order by column_name;
`);

// 3. Messages RLS
await run("messages RLS", `
  SELECT policyname, cmd, roles,
         qual::text as qual,
         with_check::text as with_check
  from pg_policies where schemaname='public' and tablename='messages'
  order by cmd, policyname;
`);

// 4. Does mark_messages_read exist / who can execute?
await run("mark_messages_read RPC presence", `
  SELECT p.proname, pg_get_function_arguments(p.oid) as args,
         has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_exec,
         has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec
  FROM pg_proc p WHERE p.proname='mark_messages_read';
`);

// 5. Storage item-images policies
await run("storage.objects item-images policies", `
  SELECT policyname, cmd, roles,
         qual::text as qual,
         with_check::text as with_check
  from pg_policies where schemaname='storage' and tablename='objects'
      and (policyname ilike '%item image%' or policyname ilike '%item-images%' or policyname = 'Public item image read')
  order by cmd, policyname;
`);

console.log("\n[inspection complete]");