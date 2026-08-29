-- 104 — Public view counter for lost/found reports ("👁 4 views").
--
-- Adds a denormalized `view_count` to both report tables plus a SECURITY
-- DEFINER RPC (`increment_item_view_count`) that is the ONLY way the count
-- changes: the column grants are revoked from anon/authenticated so clients
-- can never write it directly (no self-increment abuse, no overwrites via
-- report edits). Views are approximate social proof, not analytics — one
-- increment per unique browser visit (deduped client-side via localStorage
-- so refreshes don't inflate the number).
--
-- Run once in the Supabase SQL editor (same flow as 103).

alter table public.lost_items
  add column if not exists view_count integer not null default 0;

alter table public.found_items
  add column if not exists view_count integer not null default 0;

-- The counter is RPC-managed only — no direct column writes for clients.
revoke update (view_count) on public.lost_items from anon, authenticated;
revoke update (view_count) on public.found_items from anon, authenticated;

-- SECURITY DEFINER so any visitor (even signed-out) can register a view
-- without the tables needing broad UPDATE grants. Hardens inputs (uuid cast,
-- max-1 bump) and treats bad input as a no-op instead of raising (public
-- endpoint).
create or replace function public.increment_item_view_count(
  p_item_type text,
  p_item_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_item_type = 'lost_item' then
    update public.lost_items
       set view_count = least(view_count + 1, 2147483647)
     where id = p_item_id::uuid;
  elsif p_item_type = 'found_item' then
    update public.found_items
       set view_count = least(view_count + 1, 2147483647)
     where id = p_item_id::uuid;
  end if;
exception
  when invalid_text_representation then
    return; -- non-uuid id: best-effort, ignore
end;
$$;

-- Any visitor may call it; it only ever bumps by 1 and is type/id-checked.
grant execute on function public.increment_item_view_count(text, text) to anon, authenticated;
