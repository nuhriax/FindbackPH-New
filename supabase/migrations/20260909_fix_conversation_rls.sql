-- ===========================================================================
-- Fix Conversation RLS Policy
-- The previous policy incorrectly required BOTH lost_item AND found_item to be
-- active (impossible). This fix changes it to OR so conversations can be
-- created for either lost OR found items.
-- ===========================================================================

drop policy if exists "conversations_insert_participant" on public.conversations;

create policy "conversations_insert_participant"
  on public.conversations
  for insert
  to authenticated
  with check (
    (participant_a = auth.uid() or participant_b = auth.uid())
    and (
      exists (select 1 from public.lost_items li
              where li.id = conversations.item_id
                and conversations.item_type = 'lost_item'
                and li.status = 'active')
      or
      exists (select 1 from public.found_items fi
              where fi.id = conversations.item_id
                and conversations.item_type = 'found_item'
                and fi.status = 'active')
    )
  );
