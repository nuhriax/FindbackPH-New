/*
 * FindBack PH — Scheduled match-alert digest (Phase 16)
 *
 * Run this AFTER supabase/101-engagement-alerts.sql. It:
 *   1. Adds the watermark column `last_notified_at` the Edge Function uses to
 *      avoid re-notifying users about the same items.
 *   2. Wires a pg_cron job that calls the `match-alert-digest` Edge Function
 *      via pg_net, once every 20 minutes.
 *
 * Secret note: the cron call authenticates with the fun's verification token
 * read from `app_settings('webhook_secret')`. Set it once:
 *   INSERT INTO public.app_settings (key, value) VALUES ('webhook_secret', 'a-long-random-token')
 *   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
 * Give the Edge Function the SAME token via its environment variable:
 *   WEBHOOK_SECRET = <same token>
 */

-- ----------------------------------------------------------------------------
-- 1. Watermark column for the digest cursor
-- ----------------------------------------------------------------------------
alter table public.alert_preferences
  add column if not exists last_notified_at timestamptz;

-- ----------------------------------------------------------------------------
-- 2. Simple key/value store for the cron's verification secret
-- ----------------------------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value text not null
);

alter table public.app_settings enable row level security;
-- Blocked from public writes; only the DB owner / security-definer can set it.

-- PostgREST/RLS ignores this table entirely unless we open it; keep closed.
drop policy if exists "no direct read of app_settings" on public.app_settings;

-- ----------------------------------------------------------------------------
-- 3. Extensions used by the scheduler
-- ----------------------------------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ----------------------------------------------------------------------------
-- 4. Cron job — every 20 minutes, POST to the Edge Function.
--    Both the function URL and the verification token are read from
--    app_settings at schedule time (avoids baking secrets or hostnames into
--    this definition). The job isn't scheduled until you set the two values, so
--    re-running the file later (after configuring) is safe.
-- ----------------------------------------------------------------------------
do $$
declare
  secret_value text;
  base_url text;
begin
  select value into secret_value from public.app_settings where key = 'webhook_secret';
  select value into base_url   from public.app_settings where key = 'supabase_url';

  -- Remove any prior definition so re-runs are idempotent.
  perform cron.unschedule('match-alert-digest');

  if secret_value is not null and base_url is not null then
    perform cron.schedule(
      'match-alert-digest',
      'every 20 minutes',
      format(
        'select net.http_post(
           url := ''%s/functions/v1/match-alert-digest'',
           headers := jsonb_build_object(''Content-Type'', ''application/json'', ''x-webhook-secret'', ''%s''),
           body := ''{}''
         )',
        base_url,
        secret_value
      )
    );
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 5. Configure the job's two values, then re-run this file to schedule it.
--    Replace REF with your project ref and pick a long random token:
--      INSERT INTO public.app_settings (key, value) VALUES
--        ('supabase_url', 'https://<REF>.supabase.co'),
--        ('webhook_secret', '<a-long-random-token>')
--      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
--    Give the Edge Function the same token:
--      WEBHOOK_SECRET = <same token>
-- ----------------------------------------------------------------------------