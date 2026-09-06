-- ===========================================================================
-- RLS Strict Fix - Drop all existing update policies and recreate correctly
-- This ensures no conflicting policies allow cross-user edits.
-- ===========================================================================

-- lost_items: Drop ALL update policies and recreate with proper USING + WITH CHECK
drop policy if exists "lost_items_update_own" on public.lost_items;
drop policy if exists "lost_items_admin_moderate" on public.lost_items;

-- Owner can update their own reports
create policy "lost_items_update_own"
  on public.lost_items
  for update
  to authenticated
  using (reporter_id = auth.uid())
  with check (reporter_id = auth.uid());

-- Admins/moderators can update any report (for moderation)
create policy "lost_items_admin_moderate"
  on public.lost_items
  for update
  to authenticated
  using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  )
  with check (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );

-- found_items: Same fix
drop policy if exists "found_items_update_own" on public.found_items;
drop policy if exists "found_items_admin_moderate" on public.found_items;

create policy "found_items_update_own"
  on public.found_items
  for update
  to authenticated
  using (reporter_id = auth.uid())
  with check (reporter_id = auth.uid());

create policy "found_items_admin_moderate"
  on public.found_items
  for update
  to authenticated
  using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  )
  with check (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );

-- profiles: Fix update policy
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
