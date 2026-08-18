"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Clock,
  KeyRound,
  Laptop,
  MapPin,
  Search,
  Smartphone,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEMO_PREVIEWS,
  SEARCH_CATEGORY_CHIPS,
  SUGGESTED_LOCATIONS,
} from "./home-data";

const RECENT_KEY = "findback.recent-searches";

const CHIP_ICONS: Record<string, LucideIcon> = {
  phones: Smartphone,
  wallets: WalletCards,
  ids: BadgeCheck,
  keys: KeyRound,
  bags: BriefcaseBusiness,
  electronics: Laptop,
};

const PREVIEW_ICONS: Record<string, LucideIcon> = {
  phones: Smartphone,
  wallets: WalletCards,
  bags: BriefcaseBusiness,
  ids: BadgeCheck,
  electronics: Laptop,
};

export function SearchBox({ className }: { className?: string }) {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {
      /* ignore private-mode / quota errors */
    }
  }, []);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocused(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focused]);

  const saveRecent = (term: string) => {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...recent.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 5);
    setRecent(next);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const submit = (term: string, where: string) => {
    const t = term.trim();
    if (t) saveRecent(t);
    const params = new URLSearchParams();
    if (t) params.set("q", t);
    if (where.trim()) params.set("city", where.trim());
    const qs = params.toString();
    window.location.assign(`/search${qs ? `?${qs}` : ""}`);
  };

  // Validate the closing JSX: the form <form> ... </form> + 1 closing tag below.
  // The <div ref={rootRef}> must close before </form>.

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(q, city);
        }}
        className={cn(
          "rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_15px_45px_rgba(15,23,42,.08)]",
          "transition-all duration-300 focus-within:border-blue-300 focus-within:shadow-[0_20px_55px_rgba(37,99,235,.14)]",
          focused && "scale-[1.015]"
        )}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-h-[54px] flex-1 items-center gap-3 rounded-xl px-3">
            <Search size={19} className="shrink-0 text-blue-500" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="What did you lose?"
              aria-label="Search item"
              aria-expanded={focused}
              aria-controls="home-search-suggestions"
              autoComplete="off"
              spellCheck={false}
              className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="hidden h-9 w-px self-center bg-slate-200 sm:block" />

          <div className="flex min-h-[54px] flex-1 items-center gap-3 rounded-xl px-3">
            <MapPin size={19} className="shrink-0 text-slate-400" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="Where?"
              aria-label="Search location"
              autoComplete="address-level2"
              className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,.25)] transition-all duration-300 hover:from-blue-500 hover:to-indigo-500 hover:shadow-[0_12px_28px_rgba(37,99,235,.35)] active:scale-[.97]"
            >
              <span className="sm:hidden">Search</span>
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-0.5 sm:block"
              />
            </button>
          </div>
        </div>
        {/* CLOSING FORM TAG */}
      </form>
      {/* CLOSING DIV */}
    </div>
  );
}
