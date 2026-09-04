-- ============================================================================
-- 113 — CHAT IMAGE MESSAGES
-- ----------------------------------------------------------------------------
-- Lets chat bubbles carry photos: adds the 'image' kind + image_url column on
-- messages, and a public-read "chat-images" Storage bucket. Writes are scoped
-- to the sender's own folder (same pattern as voice-messages).
-- Idempotent — safe to re-run.
-- ============================================================================

-- 1) Message shape -----------------------------------------------------------
alter table public.messages
  add column if not exists image_url text;

-- Widen the kind constraint to include 'image' (drop-and-recreate because
-- Postgres cannot ALTER a check expression in place).
alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages
  add constraint messages_kind_check check (kind in ('text', 'audio', 'image'));

-- Image rows must carry a URL; audio rows must still carry theirs.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'messages_image_url_required'
  ) then
    alter table public.messages
      add constraint messages_image_url_required
      check (kind <> 'image' or image_url is not null);
  end if;
end $$;

-- 2) Chat photos bucket (public read — participants can view shared photos) --
insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read chat images" on storage.objects;
create policy "Public read chat images"
  on storage.objects for select
  to public
  using (bucket_id = 'chat-images');

drop policy if exists "Authenticated insert own chat images" on storage.objects;
create policy "Authenticated insert own chat images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Authenticated delete own chat images" on storage.objects;
create policy "Authenticated delete own chat images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'chat-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
