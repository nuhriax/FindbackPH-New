-- ============================================================================
-- 114 — CHAT VIDEO MESSAGES (in-app camera video mode)
-- ----------------------------------------------------------------------------
-- Adds the 'video' message kind + video_url column, and a public-read
-- "chat-videos" Storage bucket for recordings. Same ownership-scoped-write
-- and public-read pattern as chat-images / voice-messages.
-- Idempotent — safe to re-run.
-- ============================================================================

-- 1) Message shape -----------------------------------------------------------
alter table public.messages
  add column if not exists video_url text;

-- Widen the kind constraint to include 'video' (drop-and-recreate).
alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages
  add constraint messages_kind_check check (kind in ('text', 'audio', 'image', 'video'));

-- Video rows must carry a URL.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'messages_video_url_required'
  ) then
    alter table public.messages
      add constraint messages_video_url_required
      check (kind <> 'video' or video_url is not null);
  end if;
end $$;

-- 2) Chat videos bucket (public read — participants can view shared videos) --
insert into storage.buckets (id, name, public)
values ('chat-videos', 'chat-videos', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read chat videos" on storage.objects;
create policy "Public read chat videos"
  on storage.objects for select
  to public
  using (bucket_id = 'chat-videos');

drop policy if exists "Authenticated insert own chat videos" on storage.objects;
create policy "Authenticated insert own chat videos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Authenticated delete own chat videos" on storage.objects;
create policy "Authenticated delete own chat videos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'chat-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );