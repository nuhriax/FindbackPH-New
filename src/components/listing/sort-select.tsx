"use client";

import { ChevronDown } from "lucide-react";
import { ACCENT, type Accent } from "./accents";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "recently-updated", label: "Recently updated" },
] as const;

/**
 * Sort dropdown for the lost/found listings. Rendered as a Client Component
 * because it auto-submits its parent form on change, which Server Components
 * cannot do with native event handlers.
 */
export function SortSelect({
  defaultValue,
  accent,
}: {
  defaultValue: string;
  accent: Accent;
}) {
  return (
    <>
      <label htmlFor="sort" className="sr-only">
        Sort results
      </label>

      <select
        id="sort"
        name="sort"
        defaultValue={defaultValue}
        onChange={(event) => {
          event.currentTarget.form?.submit();
        }}
        className={`h-9 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-medium text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-50 focus:ring-2 ${ACCENT[accent].focus}`}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600"
      />
    </>
  );
}
