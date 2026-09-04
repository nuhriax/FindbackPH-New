-- ============================================================================
-- 111 — OPTIONAL RPC HARDENING (defense-in-depth)
--
-- verify_ownership_answers already fails closed for anonymous callers (the
-- function body returns 'auth_required' when auth.uid() is null), and Supabase
-- grants EXECUTE on new functions to public by default. Revoking anon EXECUTE
-- removes the function from anonymous PostgREST surface entirely.
--
-- Impact on the app: NONE for signed-in users. The application flow
-- (submitOwnershipAnswersAction) always calls the RPC with an authenticated
-- session, so authenticated EXECUTE is untouched.
--
-- Safe to re-run. Run in the Supabase SQL editor AFTER trust.sql.
-- NOTE: Supabase grants EXECUTE to PUBLIC by default on new functions, so the
-- revoke must target PUBLIC (anon inherits via PUBLIC otherwise).
-- ============================================================================

revoke execute on function public.verify_ownership_answers(text, uuid, text, text) from PUBLIC;
revoke execute on function public.verify_ownership_answers(text, uuid, text, text) from anon;

-- Keep authenticated + service-role access explicit.
grant execute on function public.verify_ownership_answers(text, uuid, text, text) to authenticated;
grant execute on function public.verify_ownership_answers(text, uuid, text, text) to service_role;

