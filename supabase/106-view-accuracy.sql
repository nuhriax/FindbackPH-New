-- 106 — View accuracy hardening.
--
-- 1) register_item_view now RETURNS BOOLEAN (true = this call actually
--    counted). The client uses it to only bump the displayed number when the
--    DB really counted, instead of optimistically showing +1.
-- 2) Re-derives view_count from the item_views ledger so the counter reflects
--    real, deduped views (the pre-105 counter counted every hit, including
--    bots and crawlers).

create or replace function public.register_item_view(
  p_item_type text,
  p_item_id text,
  p_viewer_key text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_item uuid;
  inserted boolean;
begin
  if p_item_type not in ('lost_item', 'found_item') then return false; end if;
  begin
    v_item := p_item_id::uuid;
  exception when others then
    return false;
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
    return false;
  else
    v_key := 'anon:' || p_viewer_key;
  end if;

  begin
    insert into public.item_views (item_type, item_id, viewer_key)
    values (p_item_type, v_item, v_key)
    on conflict (item_type, item_id, viewer_key) do nothing;
    inserted := found;
  exception when others then
    -- Unknown item id (trigger validation) or any other write failure:
    -- count nothing rather than erroring the page.
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

grant execute on function public.register_item_view(text, text, text)
  to anon, authenticated;

-- Sync the denormalized counters with the real ledger (deduped views only).
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

-- Any item with zero ledger rows should read zero, not its old inflated count.
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