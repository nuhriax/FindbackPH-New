-- 108 — Real people only: registered accounts only, 1 IP = 1 account.
--
-- Before: signed-out browsers counted as 'anon:<browser id>' views, so bots,
-- link-preview crawlers (Facebook/Messenger, WhatsApp) and anonymous visitors
-- could inflate the counter.
--
-- Now:
--   1. ONLY signed-in, registered accounts can register a view. Bots and
--      signed-out visitors are never authenticated, so they can never count.
--   2. One IP address = one account per report. Each view stores a salted
--      SHA-256 hash of the viewer's IP (never the raw IP). If a DIFFERENT
--      account already viewed this report from the same IP hash, the view is
--      not counted — shared Wi-Fi / one household counts once.
--   3. Existing anonymous ledger rows are removed and view_count is re-derived
--      from the remaining real, registered views.
--
-- The owner-only "Who viewed this report" panel (107) keeps working unchanged
-- — it just no longer shows anonymous entries, because none exist anymore.

alter table public.item_views add column if not exists ip_hash text;

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
  inserted boolean;
begin
  if p_item_type not in ('lost_item', 'found_item') then return false; end if;
  begin
    v_item := p_item_id::uuid;
  exception when others then
    return false;
  end;

  -- 1) Registered accounts only. No auth session = no view, ever. This is
  --    what excludes bots, crawlers and anonymous visitors: none of them
  --    hold a Supabase session.
  if coalesce(auth.uid()::text, '') = '' then
    return false;
  end if;
  v_key := 'user:' || auth.uid()::text;

  -- 2) One IP = one account per report: if another account already viewed
  --    this report from the same hashed IP, do not count this one.
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

grant execute on function public.register_item_view(text, text, text, text)
  to authenticated;
revoke execute on function public.register_item_view(text, text, text, text)
  from anon;

-- 3) Drop every anonymous/bot row and re-derive the counters from the real
--    registered views only.
delete from public.item_views where viewer_key like 'anon:%';

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