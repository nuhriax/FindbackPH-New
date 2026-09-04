-- ----------------------------------------------------------------------------
-- VERIFY OWNERSHIP RPC
-- Comparison happens entirely inside Postgres. Returns pass/fail only —
-- never the stored hashes. Rate-limited to 5 total attempts.
-- ----------------------------------------------------------------------------
create or replace function public.verify_ownership_answers(
  p_item_type text,
  p_item_id uuid,
  p_answer_1 text,
  p_answer_2 text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.ownership_verifications%rowtype;
  v_caller uuid := auth.uid();
  v_max_attempts constant int := 5;
begin
  if v_caller is null then
    return jsonb_build_object('passed', false, 'error', 'auth_required');
  end if;

  -- Suspicious-activity guard: suspended/banned accounts can never claim, and
  -- accounts with 10+ failed claim attempts in the last 30 days are claiming-
  -- restricted (appeal via support). One failure alone NEVER restricts anyone.
  if exists (
    select 1 from public.profiles p
    where p.id = v_caller and (p.is_suspended or p.is_banned)
  ) then
    return jsonb_build_object('passed', false, 'error', 'claiming_restricted');
  end if;

  if (
    select count(*) from public.claim_attempts a
    where a.user_id = v_caller
      and a.passed = false
      and a.created_at > now() - interval '30 days'
  ) >= 10 then
    return jsonb_build_object('passed', false, 'error', 'claiming_restricted');
  end if;

  select * into v_row
  from public.ownership_verifications
  where item_type = p_item_type::ownership_item_type
    and item_id = p_item_id;

  if not found then
    return jsonb_build_object('passed', false, 'error', 'not_found');
  end if;

  -- The owner doesn't verify against their own challenge.
  if v_row.owner_id = v_caller then
    return jsonb_build_object('passed', false, 'error', 'owner');
  end if;

  if v_row.attempts >= v_max_attempts then
    return jsonb_build_object('passed', false, 'error', 'too_many_attempts');
  end if;

  -- Compare digests; both answers required when question 2 exists.
  if digest(lower(btrim(p_answer_1)), 'sha256') <> decode(v_row.answer_1_hash, 'hex')
     or (v_row.answer_2_hash is not null and (
       p_answer_2 is null
       or digest(lower(btrim(p_answer_2)), 'sha256') <> decode(v_row.answer_2_hash, 'hex')
     )) then
    update public.ownership_verifications
      set attempts = attempts + 1, updated_at = now()
      where id = v_row.id;
    insert into public.claim_attempts (user_id, item_type, item_id, passed)
      values (v_caller, p_item_type, p_item_id, false);
    return jsonb_build_object('passed', false, 'error', 'mismatch');
  end if;

  -- Correct — record it once and reset the failure counter.
  if not (v_caller = any(v_row.passed_by)) then
    update public.ownership_verifications
      set passed_by = array_append(passed_by, v_caller), attempts = 0, updated_at = now()
      where id = v_row.id;

    -- Phase 11 — notify the report OWNER that someone passed their challenge.
    -- Only fires on the claimant's FIRST successful pass (real event). Wording
    -- is intentionally generic: no answer content, no claimant identity beyond
    -- what the owner can already see on their own report page, and the link
    -- points at the owner's own report where verification state is surfaced.
    perform public.notify_user_once(
      v_row.owner_id,
      'report_update',
      'Ownership verified',
      'Someone correctly answered your verification questions for one of your reports. Review the report before arranging any handover.',
      case p_item_type
        when 'lost_item' then '/lost/' || p_item_id::text
        else '/found/' || p_item_id::text
      end
    );
  end if;

  insert into public.claim_attempts (user_id, item_type, item_id, passed)
    values (v_caller, p_item_type, p_item_id, true);

  return jsonb_build_object('passed', true, 'error', null);
end;
$$;

-- ----------------------------------------------------------------------------
-- CHALLENGE STATUS RPC
-- Lets any signed-in user fetch a challenge's QUESTIONS and whether THEY have
-- already passed it — without ever exposing answer hashes or other users'
-- verification state.
-- ----------------------------------------------------------------------------
create or replace function public.get_ownership_challenge(
  p_item_type text,
  p_item_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.ownership_verifications%rowtype;
  v_caller uuid := auth.uid();
begin
  if v_caller is null then
    return null;
  end if;

  select * into v_row
  from public.ownership_verifications
  where item_type = p_item_type::ownership_item_type
    and item_id = p_item_id;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'exists', true,
    'is_owner', v_row.owner_id = v_caller,
    'question1', v_row.question_1,
    'question2', v_row.question_2,
    'caller_passed', v_caller = any(v_row.passed_by),
    'attempts_left', greatest(5 - v_row.attempts, 0)
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- SUCCESSFUL RETURNS COUNTER
-- Incremented ONLY by this trigger when an item actually becomes 'recovered'.
-- Users can update their own items' status via RLS, but they can NEVER touch
-- profiles.successful_returns directly (the only writer is this security-
-- definer function) — so the counter always reflects real platform activity.
-- ----------------------------------------------------------------------------
create or replace function public.bump_successful_returns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'recovered' and old.status is distinct from 'recovered' then
    update public.profiles
      set successful_returns = successful_returns + 1,
          updated_at = now()
      where id = new.reporter_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_lost_bump_returns on public.lost_items;
create trigger trg_lost_bump_returns
  after update of status on public.lost_items
  for each row execute procedure public.bump_successful_returns();

drop trigger if exists trg_found_bump_returns on public.found_items;
create trigger trg_found_bump_returns
  after update of status on public.found_items
  for each row execute procedure public.bump_successful_returns();
-- ============================================================================
-- FindBack PH — Trust & Verification (Phase 7)
-- Real, verifiable trust signals only. Nothing here invents data:
--
--   • Verified Account   → derived from Supabase Auth (email_confirmed_at),
--                          enforced in app code. No DB change needed.
--   • Trusted Member     → computed from REAL platform activity
--                          (account age + successful_returns counter below).
--   • Verified Report    → reporter has a confirmed email AND attached photos.
--   • Verified Ownership → owner sets private questions whose ANSWERS ARE ONLY
--                          STORED HASHED (SHA-256, pgcrypto). Claimants submit
--                          answers through a security-definer RPC that does the
--                          comparison inside Postgres and returns pass/fail only.
--   • successful_returns → incremented automatically by trigger when an item
--                          transitions INTO 'recovered'. Never writable by users.
--
-- Safe to re-run.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- OWNERSHIP VERIFICATION CHALLENGES
-- One optional challenge per report. Questions may be shown to other signed-in
-- users (they must see them to answer); answers are only ever stored as
-- SHA-256 hex digests and protected by COLUMN-LEVEL GRANTS so no role can
-- SELECT them through PostgREST — not even the owner after saving.
-- ----------------------------------------------------------------------------
do $$ begin
  create type ownership_item_type as enum ('lost_item', 'found_item');
exception when duplicate_object then null; end $$;

create table if not exists public.ownership_verifications (
  id uuid primary key default uuid_generate_v4(),
  item_type ownership_item_type not null,
  item_id uuid not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  question_1 text not null check (char_length(question_1) between 5 and 200),
  answer_1_hash text not null check (char_length(answer_1_hash) = 64),
  question_2 text check (question_2 is null or char_length(question_2) between 5 and 200),
  answer_2_hash text check (answer_2_hash is null or char_length(answer_2_hash) = 64),
  attempts integer not null default 0,
  -- Profile ids of non-owner users who answered correctly. Lets owner/claimant
  -- see that ownership was verified without exposing any answer content.
  passed_by uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_type, item_id)
);

alter table public.ownership_verifications enable row level security;

-- Only the report owner manages their own challenge.
drop policy if exists "Owner manages own ownership challenge" on public.ownership_verifications;
create policy "Owner manages own ownership challenge"
  on public.ownership_verifications
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Other signed-in users may see that a challenge EXISTS and its QUESTIONS only
-- (enforced together with column grants below).
drop policy if exists "Authenticated can view challenge questions" on public.ownership_verifications;
create policy "Authenticated can view challenge questions"
  on public.ownership_verifications
  for select
  to authenticated
  using (true);

-- Hard stop: revoke normal access, then re-grant everything EXCEPT the
-- answer-hash and bookkeeping columns claimants must never read.
revoke all on public.ownership_verifications from anon, authenticated;
grant select (id, item_type, item_id, owner_id, question_1, question_2)
  on public.ownership_verifications to authenticated;
grant insert, update, delete on public.ownership_verifications to authenticated;