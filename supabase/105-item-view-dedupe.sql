-- 105 — One view per viewer ("1 user = 1 view").
--
-- Migration 104 gave us a denormalized view_count bumped by an RPC, but every
-- page visit bumped it (only browser-localStorage deduped). This adds a real
-- dedupe ledger: one row per (item, viewer). Signed-in viewers are keyed by
-- their auth user id (same account = same view on any device/browser);
-- signed-out viewers are keyed by a persistent random id their browser sends.
--
-- Run once in the Supabase SQL editor (same as 104).

create table if not exists public.item_views (
  item_type text not null check (item_type in ('lost_item', 'found_item')),
  item_id uuid not null,
  viewer_key text not null check (length(viewer_key) between 8 and 128),
  viewed_at timestamptz not null default now(),
  -- The dedupe guarantee: a viewer can never register twice for one report.
  -- (A viewer could view a lost AND a found report with the same id — hence
  -- item_type in the key.)
  primary key (item_type, item_id, viewer_key)
);

-- Ledger is internal — no client reads or writes it directly. The SECURITY
-- DEFINER RPC below is the only write path; counts are read from
-- lost_items/found_items.view_count as before.
alter table public.item_views enable row level security;
revoke all on public.item_views from anon, authenticated;

-- The ledger only accepts ids that actually exist in the referenced table —
-- Postgres can't declare a two-table FK on one column, so the trigger checks
-- the right table per item_type (also blocks padding the counter with junk
-- ids for items that don't exist).
create or replace function public.item_views_valid_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists boolean;
begin
  if new.item_type = 'lost_item' then
    select exists (select 1 from public.lost_items where id = new.item_id)
      into v_exists;
  else
    select exists (select 1 from public.found_items where id = new.item_id)
      into v_exists;
  end if;
  if not v_exists then
    raise exception 'item_views: unknown % %', new.item_type, new.item_id;
  end if;
  return new;
end;
$$;

drop trigger if exists item_views_valid_item_trg on public.item_views;
create trigger item_views_valid_item_trg
  before insert on public.item_views
  for each row execute function public.item_views_valid_item();

-- Register a view exactly once per viewer. Bumps view_count only when the
-- (item, viewer) pair is new. auth.uid() wins over the browser-provided key
-- so a signed-in account counts once across all their devices/browsers.
create or replace function public.register_item_view(
  p_item_type text,
  p_item_id text,
  p_viewer_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_item uuid;
  inserted boolean;
begin
  if p_item_type not in ('lost_item', 'found_item') then return; end if;
  begin
    v_item := p_item_id::uuid;
  exception when others then
    return;
  end;
  if coalesce(auth.uid()::text, '') <> '' then
    v_key := 'user:' || auth.uid()::text;
  elsif p_viewer_key is null
        or length(p_viewer_key) < 8
        or length(p_viewer_key) > 128
        or p_viewer_key !~ '^[A-Za-z0-9_-]+$'
  then
    -- Untrustworthy/missing anonymous key: count nothing rather than
    -- letting a client inflate the counter with random keys.
    return;
  else
    v_key := 'anon:' || p_viewer_key;
  end if;

  insert into public.item_views (item_type, item_id, viewer_key)
  values (p_item_type, v_item, v_key)
  on conflict (item_type, item_id, viewer_key) do nothing;

  inserted := found;
  if not inserted then return; end if;

  if p_item_type = 'lost_item' then
    update public.lost_items
       set view_count = least(view_count + 1, 2147483647)
     where id = v_item;
  else
    update public.found_items
       set view_count = least(view_count + 1, 2147483647)
     where id = v_item;
  end if;
end;
$$;

grant execute on function public.register_item_view(text, text, text)
  to anon, authenticated;
