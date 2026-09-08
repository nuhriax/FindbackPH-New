-- ----------------------------------------------------------------------------
-- Add primary color to lost_items / found_items
-- ----------------------------------------------------------------------------
-- A fixed palette value (see src/lib/validation.ts COLORS) that powers the
-- "Color matched" matching signal and the swatch filter on search/discovery.
-- Optional — reports can always be posted without it.

alter table public.lost_items
  add column if not exists color text;

alter table public.found_items
  add column if not exists color text;

-- Keep search_vector in sync with the new field (weight C — below title/description).
create or replace function public.lost_items_search_trigger() returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.color, '')), 'C');
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create or replace function public.found_items_search_trigger() returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.color, '')), 'C');
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;
