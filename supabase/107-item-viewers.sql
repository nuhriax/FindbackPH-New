-- 107 — Report owners can see WHO viewed their report.
--
-- The item_views ledger (105) already records each first-time viewer as
-- 'user:<auth uid>' (signed-in) or 'anon:<browser id>' (signed-out). This
-- adds an owner-only RPC that decodes those rows:
--   signed-in viewers  -> profile username / name / avatar
--   anonymous browsers -> "Anonymous visitor" (no identity exists to show)
--
-- SECURITY DEFINER, but it re-checks ownership first: only the reporter of
-- the item gets rows back; everyone else gets an empty result.

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

  -- Owner check: the caller must be the reporter of this item.
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
      on pr.id::text = substr(v.viewer_key, 6)   -- strip the 'user:' prefix
    where v.item_type = p_item_type
      and v.item_id = v_item
    order by v.viewed_at desc
    limit 100;
end;
$$;

grant execute on function public.get_item_viewers(text, text) to authenticated;
