-- ============================================================================
-- 109 — PRIVATE VERIFICATION DETAILS (Trust, Safety & Anti-Fraud)
--
-- distinguishing_features holds the PRIVATE identifying details reporters use
-- to verify a claimant ("small crack beside the rear camera"). Two changes:
--
--   1. It is removed from the PUBLIC full-text search index. Previously the
--      search_vector triggers indexed it at weight C, so anyone could
--      discover private details via /search without ever passing the
--      ownership challenge. The matching engine still reads the column
--      server-side — matching is unaffected.
--
--   2. Existing rows are re-indexed so already-stored vectors lose the
--      private text immediately.
--
-- Safe to re-run. Run once in the Supabase SQL editor (same as 104/105).
-- ============================================================================

-- 1) Triggers without distinguishing_features (same bodies as schema.sql).
create or replace function public.lost_items_search_trigger() returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B');
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create or replace function public.found_items_search_trigger() returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B');
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

-- 2) Re-index existing rows (touches only updated_at/search_vector).
update public.lost_items set updated_at = updated_at;
update public.found_items set updated_at = updated_at;
