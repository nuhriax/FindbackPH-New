-- ============================================================================
-- FindBack PH — Shared rate-limit store (F-012 remediation, 2026-09-16)
-- ----------------------------------------------------------------------------
-- Replaces the in-process Map limiter (which resets per serverless instance)
-- with a Postgres-backed sliding window callable from every instance.
--
--   rate_limit_hits  — append-only hit log, bucket+IP keyed.
--   consume_rate_limit(p_bucket, p_ip, p_limit, p_window_ms) — SECURITY
--     DEFINER RPC: prunes expired rows, counts hits in the window, and
--     inserts a new hit only when under the limit. Returns true when the
--     request is allowed.
--
-- The table is NEVER exposed to anon/authenticated (no grants, RLS enabled);
-- it is reachable only through this RPC, and callers can only rate-limit
-- themselves — there is nothing to read, forge, or bypass.
-- Idempotent: safe to re-run.
-- ============================================================================

create table if not exists public.rate_limit_hits (
  id bigint generated always as identity primary key,
  bucket text not null,
  ip text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_window_idx
  on public.rate_limit_hits (bucket, ip, created_at);

alter table public.rate_limit_hits enable row level security;

-- No policies: direct reads/writes from anon or authenticated are denied.
revoke all on public.rate_limit_hits from anon, authenticated;

create or replace function public.consume_rate_limit(
  p_bucket text,
  p_ip text,
  p_limit integer,
  p_window_ms bigint
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cutoff timestamptz;
  v_hits integer;
begin
  if p_bucket is null or p_ip is null or p_limit is null or p_window_ms is null
     or char_length(p_bucket) > 64 or char_length(p_ip) > 128
     or p_limit < 1 or p_limit > 1000 or p_window_ms < 1000 or p_window_ms > 86400000 then
    -- Malformed arguments fail CLOSED.
    return false;
  end if;

  v_cutoff := now() - make_interval(secs => p_window_ms / 1000.0);

  -- Opportunistic prune of this bucket's expired rows (keeps the table small).
  delete from public.rate_limit_hits
  where bucket = p_bucket and created_at < v_cutoff;

  select count(*) into v_hits
  from public.rate_limit_hits
  where bucket = p_bucket and ip = p_ip and created_at >= v_cutoff;

  if v_hits >= p_limit then
    return false;
  end if;

  insert into public.rate_limit_hits (bucket, ip) values (p_bucket, p_ip);
  return true;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, bigint)
  from anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, bigint)
  to authenticated, anon;
