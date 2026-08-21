"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Bookmark, PackageCheck, PackageX, Sparkles } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/validation";

type TabKey = "matches" | "saved" | "lost" | "found";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number | string; className?: string }> }[] =
  [
    { key: "matches", label: "Possible matches", icon: Sparkles },
    { key: "saved", label: "Saved", icon: Bookmark },
    { key: "lost", label: "Lost reports", icon: PackageX },
    { key: "found", label: "Found reports", icon: PackageCheck },
  ];

export function OverviewTabs({
  matches = [],
  savedItems = [],
  lostItems = [],
  foundItems = [],
}: {
  matches: any[];
  savedItems: any[];
  lostItems: any[];
  foundItems: any[];
}) {
  const counts: Record<TabKey, number> = {
    matches: matches.length,
    saved: savedItems.length,
    lost: lostItems.length,
    found: foundItems.length,
  };
  const emptyAll = counts.matches + counts.saved + counts.lost + counts.found === 0;
  const defaultTab: TabKey =
    (["matches", "saved", "lost", "found"] as TabKey[]).find((k) => counts[k] > 0) ?? "matches";
  const [active, setActive] = useState<TabKey>(defaultTab);

  return (
    <div className="card overflow-hidden">
      {/* Tab bar */}
      <div className="flex flex-wrap items-center gap-1 overflow-x-auto border-b border-slate-200/70 px-2 pt-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-blue-600 bg-white text-blue-700"
                  : "border-transparent text-slate-600 hover:text-navy-900"
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{t.label}</span>
              <span
                className={`rounded-full px-1.5 text-xs tabular-nums ${
                  isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {counts[t.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Panel body */}
      <div className="divide-y divide-slate-100">
        {emptyAll ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            Your activity will show up here as you report, match, and save items.
          </div>
        ) : active === "matches" ? (
          matches.length ? (
            matches.map((m: any) => <MatchRow key={m.id} match={m} />)
          ) : (
            <EmptyRow text="No possible matches yet — we'll notify you when one is found." />
          )
        ) : active === "saved" ? (
          savedItems.length ? (
            savedItems.map((s: any) => <SavedRow key={s.id} saved={s} />)
          ) : (
            <EmptyRow text="You haven't saved any reports yet." />
          )
        ) : active === "lost" ? (
          lostItems.length ? (
            lostItems.map((i: any) => <ItemRow key={i.id} item={i} kind="lost" />)
          ) : (
            <EmptyRow text="You haven't reported any lost items yet." />
          )
        ) : foundItems.length ? (
          foundItems.map((i: any) => <ItemRow key={i.id} item={i} kind="found" />)
        ) : (
          <EmptyRow text="You haven't reported any found items yet." />
        )}
      </div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <div className="px-5 py-8 text-center text-sm text-slate-500">{text}</div>;
}

const STATUS_TONES: Record<string, string> = {
  active: "border-blue-200 bg-blue-50 text-blue-700",
  recovered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  matched: "border-amber-200 bg-amber-50 text-amber-700",
  archived: "border-slate-200 bg-slate-100 text-slate-600",
};

function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONES[status] ?? "border-slate-200 bg-slate-100 text-slate-700";
  const label = status === "recovered" ? "Returned" : status;
  return <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs capitalize ${tone}`}>{label}</span>;
}

function MatchRow({ match }: { match: any }) {
  const found = match.found_items?.[0];
  const location = [found?.city, found?.province].filter(Boolean).join(", ") || "Location not set";
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium text-navy-900">{found?.title ?? "Matching found report"}</p>
        <p className="truncate text-xs text-slate-500">
          {location}
          {match.score != null ? ` · ${Math.round(match.score * 100)}% match` : ""}
        </p>
      </div>
      <Link href={`/found/${match.found_item_id}`} className="btn-secondary !py-1.5 text-xs">
        View
      </Link>
    </div>
  );
}

function SavedRow({ saved }: { saved: any }) {
  const item = saved.lost_items || saved.found_items;
  const isLost = !!saved.lost_items;
  const href = isLost ? `/lost/${saved.lost_item_id}` : `/found/${saved.found_item_id}`;
  const title = item?.title ?? "Saved item";
  const category = item?.category
    ? (CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ?? "Other")
    : "";
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium text-navy-900">{title}</p>
        {category && <p className="truncate text-xs text-slate-500">{category}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusPill status={item?.status ?? "active"} />
        <Link href={href} className="btn-ghost !py-1.5 text-xs">
          View
        </Link>
      </div>
    </div>
  );
}

function ItemRow({ item, kind }: { item: any; kind: "lost" | "found" }) {
  const href = kind === "lost" ? `/lost/${item.id}` : `/found/${item.id}`;
  const dateKey = kind === "lost" ? item.date_lost : item.date_found;
  let dateLabel = "";
  if (dateKey) {
    const d = new Date(dateKey);
    if (!Number.isNaN(d.getTime())) dateLabel = format(d, "MMM d, yyyy");
  }
  const category = item.category
    ? (CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ?? "Other")
    : "";
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium text-navy-900">{item.title}</p>
        <p className="truncate text-xs text-slate-500">
          {category}
          {dateLabel ? ` · ${dateLabel}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusPill status={item.status} />
        <Link href={href} className="btn-ghost !py-1.5 text-xs">
          View
        </Link>
      </div>
    </div>
  );
}