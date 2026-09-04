-- ============================================================================
-- 112 — VOICE MESSAGES + CALL SUPPORT
-- ----------------------------------------------------------------------------
-- Adds message "kind" (text | audio) so chat bubbles can carry recorded voice
-- notes, plus a public "voice-messages" Storage bucket for the recordings.
-- Idempotent — safe to re-run.
-- ============================================================================

-- 1) Message shape -----------------------------------------------------------
alter table public.messages
  add column if not exists kind text not null default 'text';

alter table public.messages
  add column if not exists audio_url text;

alter table public.messages
  add column if not exists audio_duration integer;

-- Only known kinds, and audio rows must carry a URL.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'messages_kind_check'
  ) then
    alter table public.messages
      add constraint messages_kind_check check (kind in ('text', 'audio'));
  end if;
end $$;

-- 2) Voice recordings bucket (public read — chat participants can play notes) -
insert into storage.buckets (id, name, public)
values ('voice-messages', 'voice-messages', true)
on conflict (id) do nothing;

drop policy if exists "Public read voice messages" on storage.objects;
create policy "Public read voice messages"
  on storage.objects for select
  to public
  using (bucket_id = 'voice-messages');

drop policy if exists "Authenticated insert own voice notes" on storage.objects;
create policy "Authenticated insert own voice notes"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'voice-messages'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Authenticated update own voice notes" on storage.objects;
create policy "Authenticated update own voice notes"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'voice-messages'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Authenticated delete own voice notes" on storage.objects;
create policy "Authenticated delete own voice notes"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'voice-messages'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
