-- 105 — First-party product analytics (`product_events`).
--
-- Lightweight event store that powers the product questions:
--   * where users abandon the report wizard (report_step / report_abandoned)
--   * which search filters are used (search_performed)
--   * whether matching produces useful results (match_impression / match_clicked)
--   * whether people understand ownership verification (verification_*)
--   * where messaging gets confusing (message_sent / conversation_opened)
--   * which mobile screens cause problems (page_view + device class, js_error,
--     rage_click)
--
-- Privacy: NO message bodies, answers, titles, or personal data — only event
-- names, coarse properties, page paths, and a random per-tab session id.
--
-- Run once in the Supabase SQL editor (same flow as 104).

create table if not exists public.product_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event_name text not null,
  area text not null,
  path text,
  session_id text,
  user_id uuid references auth.users (id) on delete set null,
  props jsonb not null default '{}'::jsonb,
  user_agent text
);

create index if not exists product_events_name_created_idx
  on public.product_events (event_name, created_at desc);
create index if not exists product_events_session_idx
  on public.product_events (session_id, created_at);

alter table public.product_events enable row level security;

-- Anyone (even signed-out visitors) may record events — that's the point of a
-- funnel. Only admins/moderators may read them; nobody but the service role
-- can update or delete.
create policy "product_events_insert_anyone"
  on public.product_events for insert
  to anon, authenticated
  with check (true);

create policy "product_events_select_admin"
  on public.product_events for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'moderator')
    )
  );

grant insert on public.product_events to anon, authenticated;
grant select on public.product_events to authenticated;
