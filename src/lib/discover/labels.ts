import { formatDistanceToNow, isValid } from "date-fns";
import type { DateFilter, FeedType, SortOption } from "./params";

/** Human labels for every feed state enum — single source for UI + hrefs. */

export const TYPE_LABELS: Record<FeedType, string> = {
  all: "All",
  lost: "Lost",
  found: "Found",
};

export const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  any: "Any time",
  today: "Today",
  week: "Last 7 days",
  month: "Last 30 days",
  older: "Older",
};

export const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  oldest: "Oldest",
  "recently-updated": "Recently Updated",
};

/** "Reported 3 days ago" — or a neutral fallback for missing/invalid dates. */
export function reportedLabel(value: string): string {
  if (!value) {
    return "Reported just now";
  }

  const date = new Date(value);

  if (!isValid(date)) {
    return "Reported just now";
  }

  // Clock-skew / edge guards: a report timestamped a few seconds (or even a
  // few seconds in the future) must never render as "0 minutes ago" or
  // "in 5 minutes" — the feed's freshest possible label is "just now".
  const diffSeconds = (Date.now() - date.getTime()) / 1000;
  if (diffSeconds < 60) {
    return "Reported just now";
  }

  return `Reported ${formatDistanceToNow(date, {
    addSuffix: true,
  })}`;
}