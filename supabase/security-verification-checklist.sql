-- ============================================================================
-- SECURITY VERIFICATION CHECKLIST (run MANUALLY in Supabase → SQL Editor)
--
-- These queries VERIFY the live database after running migrations in order:
--   109-private-verification.sql → 110-trust-safety.sql → trust.sql
--   → (optional) 111-optional-rpc-hardening.sql
--
-- They are READ-ONLY diagnostics — none of them modify data.
-- Run each section and compare against the EXPECTED result.
-- ============================================================================

-- ============================================================================
-- 1. MIGRATIONS APPLIED?
-- ============================================================================

-- 1a. Private-details table exists with RLS enabled
select c.relname, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('item_private_details', 'return_confirmations', 'claim_attempts', 'ownership_verifications');
-- EXPECTED: all four rows with rls_enabled = true

-- 1b. How many public rows still carry private text? (data scrub check)
select
  (select count(*) from public.lost_items  where distinguishing_features is not null) as lost_leaked,
  (select count(*) from public.found_items where distinguishing_features is not null) as found_leaked;
-- EXPECTED: 0 / 0  (everything was copied into item_private_details and scrubbed)

-- 1c. Copy actually happened
select item_type, count(*) from public.item_private_details group by item_type;
-- EXPECTED: matches the number of reports that previously had features

-- ============================================================================
-- 2. SEARCH PRIVACY — distinguishing_features must NOT be in the search vector
-- ============================================================================

-- 2a. Trigger bodies must index only title (A) + description (B)
select proname, prosrc
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in ('lost_items_search_trigger', 'found_items_search_trigger');
-- EXPECTED: setweight(... title ...,'A') || setweight(... description ...,'B')
--           and NO mention of distinguishing_features

-- 2b. Live vector leak check — search for a known private phrase
--     (replace 'scratch underneath' with text you know a report holds privately)
select 'lost' as src, id, title from public.lost_items
 where search_vector @@ to_tsquery('english', 'scratch & underneath')
 union all
select 'found', id, title from public.found_items
 where search_vector @@ to_tsquery('english', 'scratch & underneath');
-- EXPECTED: no rows matching only via the private phrase (title/description
-- mentions are fine)

-- ============================================================================
-- 3. RPC HARDENING (after 111, if applied)
-- ============================================================================

select grantee, privilege_type
from information_schema.role_function_grants
where routine_schema = 'public'
  and routine_name = 'verify_ownership_answers';
-- EXPECTED (with 111): 'authenticated' → EXECUTE only, no 'anon'
-- EXPECTED (without 111): 'anon' + 'authenticated' → EXECUTE (function still
--   fail-closes anonymous calls in its body)

-- ============================================================================
-- 4. RLS BEHAVIOR — use the API role to simulate real client access.
--    Run these as sets, one row per expectation.
-- ============================================================================

-- 4a. claim_attempts: NO client role has any privilege
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'claim_attempts';
-- EXPECTED: zero rows for 'anon' and 'authenticated'

-- 4b. ownership_verifications: authenticated SELECT is column-limited
select privilege_type, column_name
from information_schema.role_column_grants
where table_schema = 'public' and table_name = 'ownership_verifications'
  and grantee = 'authenticated'
order by column_name;
-- EXPECTED columns: id, item_type, item_id, owner_id, question_1, question_2
-- EXPECTED NEVER: answer_1_hash, answer_2_hash, attempts, passed_by

-- 4c. Hash columns must not be reachable by any table-level grant either
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'ownership_verifications';
-- EXPECTED: table-level SELECT must NOT exist for anon/authenticated
-- (only column-level grants above; insert/update/delete are table-level)

-- ============================================================================
-- 5. FUNCTION SECURITY FLAGS — verify RPCs are SECURITY DEFINER with a pinned
--    search_path, and NOT leaks (leakproof cannot apply to definer)
-- ============================================================================

select proname, prosecdef as security_definer, proconfig
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in ('verify_ownership_answers', 'get_ownership_challenge',
                  'bump_successful_returns', 'notify_user_once');
-- EXPECTED: security_definer = true and proconfig includes search_path=public

-- ============================================================================
-- 6. RETURN-FLOW SUPPORT — trigger that credits successful_returns exists
-- ============================================================================

select tgname, tgrelid::regclass as on_table
from pg_trigger
where tgname in ('trg_lost_bump_returns', 'trg_found_bump_returns') and not tgisinternal;
-- EXPECTED: both triggers present on lost_items / found_items
