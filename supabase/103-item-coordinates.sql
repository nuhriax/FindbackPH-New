-- 103 — Optional "pin exact location" coordinates on lost/found reports.
--
-- Backs the Philippines-only map picker on the report wizard (Step 2) and the
-- LOST/FOUND map view on /search. Columns are nullable so older reports (and
-- reports submitted without a pin) are unaffected. Run this once on the live
-- Supabase project; the app tolerates the columns being absent, but pins are
-- only persisted once this migration has run.

alter table public.lost_items
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.found_items
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;
