-- Report UX: optional time context for more precise matching.
-- Kept separate from the public description so it can be filtered/displayed
-- consistently without encouraging people to reveal private addresses.
ALTER TABLE public.lost_items
  ADD COLUMN IF NOT EXISTS time_window text;

ALTER TABLE public.found_items
  ADD COLUMN IF NOT EXISTS time_window text;

ALTER TABLE public.lost_items
  ADD CONSTRAINT lost_items_time_window_length
  CHECK (time_window IS NULL OR char_length(time_window) <= 100);

ALTER TABLE public.found_items
  ADD CONSTRAINT found_items_time_window_length
  CHECK (time_window IS NULL OR char_length(time_window) <= 100);
