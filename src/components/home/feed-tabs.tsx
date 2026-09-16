"use client";

import { useMemo, useState } from "react";
import { Gift, PackageSearch, HeartHandshake, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { ItemCard } from "@/components/item-card";

export type FeedCard = {
  id: string;
  href: string;
  title: string;
  category: import("@/types/database").ItemCategory;
  city: string;
  province: string;
  description: string;
  dateLabel: string;
  kind: "lost" | "found";
  imageUrl?: string | null;
  views?: number | null;
  reward?: number | null;
};

type FeedTab = "all" | "lost" | "found" | "reward";

const TABS: { value: FeedTab; label: string; icon: typeof LayoutGrid }[] = [
  { value: "all", label: "All reports", icon: LayoutGrid },
  { value: "lost", label: "Lost", icon: PackageSearch },
  { value: "found", label: "Found", icon: HeartHandshake },
  { value: "reward", label: "With reward", icon: Gift },
];

/**
 * FeedTabs — client-side filter over the server-rendered latest reports.
 * Tabs filter the already-fetched 6 cards instantly (no refetch, no layout
 * shift); empty tabs are hidden so users never land on a dead filter.
 */
export function FeedTabs({ cards }: { cards: FeedCard[] }) {
  const [tab, setTab] = useState<FeedTab>("all");

  const available = useMemo(() => {
    const set = new Set<FeedTab>(["all"]);
    if (cards.some((c) => c.kind === "lost")) set.add("lost");
    if (cards.some((c) => c.kind === "found")) set.add("found");
    if (cards.some((c) => (c.reward ?? 0) > 0)) set.add("reward");
    return set;
  }, [cards]);

  const visible = useMemo(
    () =>
      tab === "all"
        ? cards
        : cards.filter((c) =>
            tab === "reward" ? (c.reward ?? 0) > 0 : c.kind === tab
          ),
    [cards, tab]
  );

  if (cards.length === 0) return null;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Filter latest reports"
        className="flex flex-wrap gap-2"
      >
        {TABS.map(({ value, label, icon: Icon }) => {
          if (!available.has(value)) return null;
          const active = tab === value;
          return (
            <button
              key={value}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(value)}
              className={cn(
                "inline-flex min-h-[40px] items-center gap-2 border px-4 text-xs font-bold transition",
                "rounded-t-md",
                active
                  ? value === "lost"
                    ? "border-coral-200 border-b-transparent bg-coral-50 text-coral-700"
                    : value === "found"
                      ? "border-ocean-200 border-b-transparent bg-ocean-50 text-ocean-700"
                      : "border-sun-200 border-b-transparent bg-sun-50 text-sun-700"
                  : "border-transparent bg-kraft-100 text-ink-soft hover:bg-kraft-200 hover:text-ink"
              )}
            >
              <Icon size={13} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      <div className="board-grid mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => (
          <ItemCard
            key={`${item.kind}-${item.id}`}
            href={item.href}
            title={item.title}
            category={item.category}
            city={item.city}
            province={item.province}
            reported={item.dateLabel}
            description={item.description}
            kind={item.kind}
            imageUrl={item.imageUrl}
            views={item.views}
            reward={item.reward}
          />
        ))}
      </div>
    </div>
  );
}
