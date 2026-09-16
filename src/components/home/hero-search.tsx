"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MapPin, Search, X } from "lucide-react";
import { PH_CITIES_BY_PROVINCE } from "@/lib/ph-addresses";
import { cn } from "@/lib/utils";

/**
 * HeroSearch — dual-intent search box for the homepage hero.
 *
 * The "I lost / I found" tabs set the `type` filter the /discover schema
 * already validates (`lost | found | all`), so the homepage search lands on
 * a pre-filtered result page instead of dumping mixed reports. Location feeds
 * the `city` param. Native GET form — works without JS.
 */

/**
 * Popular shortcuts shown first while the City field is empty. Everything
 * else in the country comes from the shared reference data below.
 */
const POPULAR_CITIES = [
  "Metro Manila",
  "Quezon City",
  "Cebu City",
  "Davao City",
  "Cagayan de Oro City",
  "Iloilo City",
  "Baguio City",
  "Taguig City",
  "Pasay City",
  "Makati City",
];

/**
 * Every Philippine city + municipality, derived once from the report
 * wizard's province→cities reference data (same source of truth, no
 * duplicate dataset to maintain). Names repeat across provinces ("San Juan",
 * "Naga", …) so they're deduped, then alphabetized.
 */
const ALL_PH_CITIES: string[] = Array.from(
  new Set(Object.values(PH_CITIES_BY_PROVINCE).flat()),
).sort((a, b) => a.localeCompare(b));

/** Cap the rendered options so the ~1,600-entry list stays snappy. */
const MAX_SUGGESTIONS = 50;

export function HeroSearch({ className }: { className?: string }) {
  const [city, setCity] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Empty field → popular shortcuts; typing → filter every PH city
  // (case-insensitive), rendered capped by MAX_SUGGESTIONS.
  const matches = useMemo(() => {
    const q = city.trim().toLowerCase();
    if (!q) return POPULAR_CITIES;
    return ALL_PH_CITIES.filter((c) => c.toLowerCase().includes(q));
  }, [city]);
  const visibleCities = matches.slice(0, MAX_SUGGESTIONS);
  const hiddenCount = matches.length - visibleCities.length;

  // Close the suggestion panel on outside click.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const pickCity = (value: string) => {
    setCity(value);
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Pin — the slip is pinned to the board (tucked onto the top edge so
          it never overlaps the inputs below) */}
      <span
        aria-hidden="true"
        className="absolute -top-1.5 left-1/2 z-20 h-3 w-3 -translate-x-1/2 rounded-full bg-gradient-to-b from-sun-300 to-sun-600 shadow-[0_2px_4px_rgba(36,30,23,0.4)] ring-1 ring-ink/20"
      />

      {/* Search form — a paper slip, not a glass SaaS bar */}
      <form
        action="/discover"
        method="GET"
        role="search"
        className="rounded-xl border border-cork-700/30 bg-kraft-100 p-2 pt-2.5 shadow-[3px_3px_0_0_rgba(36,30,23,0.15)] transition focus-within:border-sun-300 focus-within:ring-4 focus-within:ring-sun-100"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-h-[48px] flex-1 items-center gap-3 rounded-lg border border-cork-700/25 bg-white/80 px-3">
            <Search size={18} className="shrink-0 text-ink-faint" />
            <input
              name="q"
              type="search"
              maxLength={100}
              placeholder="What are you looking for? e.g. iPhone, wallet, school ID"
              aria-label="Search reports"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
            />
          </div>

          {/* City — custom suggestion dropdown (native <datalist> renders as
              the OS-default dark list and can't be themed) */}
          <div ref={boxRef} className="relative sm:w-44">
            <div className="flex min-h-[48px] items-center gap-2 rounded-lg border border-cork-700/25 bg-white/80 px-3 focus-within:border-sun-400">
              <MapPin size={16} className="shrink-0 text-ink-faint" />
              <input
                ref={inputRef}
                name="city"
                type="text"
                maxLength={100}
                autoComplete="off"
                role="combobox"
                aria-expanded={open}
                aria-controls="hero-city-listbox"
                aria-autocomplete="list"
                placeholder="City"
                aria-label="City"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setOpen(true);
                  setActiveIndex(-1);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setOpen(true);
                    setActiveIndex((i) =>
                      visibleCities.length
                        ? (i + 1) % visibleCities.length
                        : -1,
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveIndex((i) =>
                      visibleCities.length
                        ? (i - 1 + visibleCities.length) %
                          visibleCities.length
                        : -1,
                    );
                  } else if (e.key === "Enter") {
                    // With the panel open, Enter picks the highlighted (or
                    // first) match; otherwise the form submits normally.
                    if (open && visibleCities.length > 0) {
                      e.preventDefault();
                      pickCity(
                        visibleCities[activeIndex >= 0 ? activeIndex : 0],
                      );
                    }
                  } else if (e.key === "Escape") {
                    setOpen(false);
                    setActiveIndex(-1);
                  }
                }}
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
              />
              {city ? (
                <button
                  type="button"
                  aria-label="Clear city"
                  onClick={() => {
                    pickCity("");
                    inputRef.current?.focus();
                  }}
                  className="shrink-0 rounded-full p-0.5 text-ink-faint transition hover:bg-kraft-200 hover:text-ink"
                >
                  <X size={13} />
                </button>
              ) : null}
            </div>

            {open && visibleCities.length > 0 ? (
              <ul
                id="hero-city-listbox"
                role="listbox"
                aria-label={city.trim() ? "Matching Philippine cities" : "Popular cities"}
                className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-64 overflow-y-auto rounded-lg border border-cork-700/25 bg-white py-1 shadow-[0_10px_24px_-8px_rgba(36,30,23,0.35)]"
              >
                <li
                  aria-hidden="true"
                  className="border-b border-kraft-200 px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint"
                >
                  {city.trim()
                    ? `Cities & municipalities · ${matches.length} match${matches.length === 1 ? "" : "es"}`
                    : "Popular cities"}
                </li>
                {visibleCities.map((c, i) => (
                  <li key={c} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={city === c}
                      onMouseDown={(e) => {
                        // mousedown (not click) so the input keeps focus
                        e.preventDefault();
                        pickCity(c);
                      }}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink transition",
                        i === activeIndex || city === c
                          ? "bg-sun-100"
                          : "hover:bg-kraft-100",
                      )}
                    >
                      <MapPin size={13} className="shrink-0 text-ink-faint" />
                      <span className="truncate">{c}</span>
                    </button>
                  </li>
                ))}
                {hiddenCount > 0 ? (
                  <li
                    aria-hidden="true"
                    className="border-t border-kraft-200 px-3 py-1.5 text-[11px] text-ink-faint"
                  >
                    and {hiddenCount.toLocaleString()} more — keep typing…
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>

          <button
            type="submit"
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-lg bg-sun-400 px-6 text-sm font-bold text-ink shadow-[2px_2px_0_0_#241E17] transition hover:-translate-y-0.5 hover:bg-sun-300 active:translate-y-0.5 active:shadow-none"
          >
            <Search size={16} />
            Search
          </button>
        </div>
      </form>
    </div>
  );
}
