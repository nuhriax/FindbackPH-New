-- 109 — Owner views never count: exclude the reporter from view stats.
--
-- Production diagnosis: the live DB runs migration 108's register_item_view,
-- which counts any registered account, including the report owner. The app's
-- server-action guard exists but the database RPC itself needs the same rule
-- so no code path can inflate the counter with self-views.
--
-- This migration:
--  1. Updates register_item_view to return false immediately when the caller
--     is the reporter of the item (auth.uid = reporter_id).
--  2. Removes owner rows already recorded in the item_views ledger
--     and re-derives view_count from the remaining non-owner rows.
--
-- Run once in the Supabase SQL editor. Safe to re-run.

create or replace function public.register_item_view(
  p_item_type text,
  p_item_id text,
  p_viewer_key text,
  p_ip_hash text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_item uuid;
  v_reporter uuid;
  inserted boolean;
begin
  if p_item_type not in ('lost_item', 'found_item') then return false; end if;
  begin
    v_item := p_item_id::uuid;
  exception when others then
    return false;
  end;

  if coalesce(auth.uid()::text, '') = '' then
    return false;
  end if;
  v_key := 'user:' || auth.uid()::text;

  -- Owners never count as viewers of their own report.
  if p_item_type = 'lost_item' then
    select reporter_id into v_reporter from public.lost_items where id = v_item;
  else
    select reporter_id into v_reporter from public.found_items where id = v_item;
  end if;
  if v_reporter is not null and v_reporter = auth.uid() then
    return false;
  end if;

  if p_ip_hash is not null
     and length(p_ip_hash) between 16 and 128
     and p_ip_hash ~ '^[A-Fa-f0-9]+$'
     and exists (
       select 1 from public.item_views v
        where v.item_type = p_item_type
          and v.item_id = v_item
          and v.ip_hash = p_ip_hash
          and v.viewer_key <> v_key
     )
  then
    return false;
  end if;

  begin
    insert into public.item_views (item_type, item_id, viewer_key, ip_hash)
    values (p_item_type, v_item, v_key, p_ip_hash)
    on conflict (item_type, item_id, viewer_key) do nothing;
    inserted := found;
  exception when others then
    return false;
  end;
  if not inserted then return false; end if;

  if p_item_type = 'lost_item' then
    update public.lost_items
       set view_count = least(view_count + 1, 2147483647)
     where id = v_item;
  else
    update public.found_items
       set view_count = least(view_count + 1, 2147483647)
     where id = v_item;
  end if;
  return true;
end;
$$;

-- Purge owner rows recorded before this fix, then re-derive counters so
-- existing reports drop their self-view ("1 viewer" with no other users).
delete from public.item_views v
using public.lost_items l
where v.item_type = 'lost_item'
  and v.item_id = l.id
  and v.viewer_key = 'user:' || l.reporter_id::text;

delete from public.item_views v
using public.found_items f
where v.item_type = 'found_item'
  and v.item_id = f.id
  and v.viewer_key = 'user:' || f.reporter_id::text;

update public.lost_items l
   set view_count = coalesce(v.cnt, 0)
  from (select item_id, count(*)::int as cnt from public.item_views
         where item_type = 'lost_item' group by item_id) v
 where v.item_id = l.id
   and l.view_count is distinct from coalesce(v.cnt, 0);

update public.found_items f
   set view_count = coalesce(v.cnt, 0)
  from (select item_id, count(*)::int as cnt from public.item_views
         where item_type = 'found_item' group by item_id) v
 where v.item_id = f.id
   and f.view_count is distinct from coalesce(v.cnt, 0);

update public.lost_items
   set view_count = 0
 where view_count > 0
   and not exists (
     select 1 from public.item_views v
      where v.item_type = 'lost_item' and v.item_id = lost_items.id
   );

update public.found_items
   set view_count = 0
 where view_count > 0
   and not exists (
     select 1 from public.item_views v
      where v.item_type = 'found_item' and v.item_id = found_items.id
   );

grant execute on function public.register_item_view(text, text, text, text)
  to authenticated;
revoke execute on function public.register_item_view(text, text, text, text)
  from anon;


-- The owner-only "who viewed" panel (107) must also hide the reporter if any
-- owner rows were recorded before this migration.
create or replace function public.get_item_viewers(
  p_item_type text,
  p_item_id text
)
returns table (
  display_name text,
  username text,
  avatar_url text,
  is_member boolean,
  viewed_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_item uuid;
  v_reporter uuid;
begin
  if p_item_type not in ('lost_item', 'found_item') then
    return;
  end if;
  begin
    v_item := p_item_id::uuid;
  exception when others then
    return;
  end;

  if p_item_type = 'lost_item' then
    select reporter_id into v_reporter from public.lost_items where id = v_item;
  else
    select reporter_id into v_reporter from public.found_items where id = v_item;
  end if;

  if v_reporter is null or v_reporter is distinct from auth.uid() then
    return;
  end if;

  return query
    select
      case
        when pr.id is not null
          then nullif(trim(coalesce(pr.first_name, '') || ' ' || coalesce(pr.last_name, '')), '')
          else 'Anonymous visitor'
      end,
      pr.username,
      pr.avatar_url,
      pr.id is not null,
      v.viewed_at
    from public.item_views v
    left join public.profiles pr
      on pr.id::text = substr(v.viewer_key, 6)
    where v.item_type = p_item_type
      and v.item_id = v_item
      and v.viewer_key <> 'user:' || v_reporter::text
    order by v.viewed_at desc
    limit 100;
end;
$$;

grant execute on function public.get_item_viewers(text, text) to authenticated;