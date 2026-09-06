"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award,
  MapPin,
  PackageCheck,
  PackageSearch,
} from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/validation";
import { MessageButton } from "@/components/message-button";

type ReportRow = {
  id: string;
  title: string;
  category: string | null;
  city: string | null;
  province: string | null;
  created_at: string | null;
  reward_amount?: number | null;
};

type Filter = "all" | "lost" | "found";

/**
 * Interactive report browser for a member's public profile.
 * All/Lost/Found tabs + a one-tap Message action per report (item-scoped
 * conversations), so visitors can reach the member without hunting through
 * the item detail pages.
 */
export function MemberReports({
  reports,
  images,
  isOwn,
  memberName,
}: {
  reports: { row: ReportRow; kind: "lost" | "found" }[];
  /** report id -> signed thumbnail url */
  images: Record<string, string>;
  isOwn: boolean;
  memberName: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const posted = (iso: string | null) => {
    if (!iso) return "";
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const s = Math.max(0, Math.floor(diff / 1000));
      if (s < 60) return "just now";
      const m = Math.floor(s / 60);
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      const d = Math.floor(h / 24);
      if (d < 7) return `${d}d ago`;
      const w = Math.floor(d / 7);
      if (w < 5) return `${w}w ago`;
      const mo = Math.floor(d / 30);
      if (mo < 12) return `${mo}mo ago`;
      return `${Math.floor(mo / 12)}y ago`;
    } catch {
      return "";
    }
  };

  const lostCount = reports.filter((r) => r.kind === "lost").length;
  const foundCount = reports.filter((r) => r.kind === "found").length;
  const visible = filter === "all" ? reports : reports.filter((r) => r.kind === filter);

const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: reports.length },
    { key: "lost", label: "Lost", count: lostCount },
    { key: "found", label: "Found", count: foundCount },
  ];

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-navy-900">Active reports</h2>
          {reports.length > 0 && (
            <p className="mt-0.5 text-xs text-slate-500">Posted by {memberName}, currently looking for a home</p>
          )}
        </div>
        <span className="text-xs font-medium text-slate-400">{reports.length} total</span>
      </div>

      {/* Segmented tabs */}
      <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
        {tabs.map((t) => {
          const selected = filter === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              aria-pressed={selected}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                selected ? "bg-white text-navy-900 shadow-sm" : "text-slate-500 hover:text-navy-800"
              }`}
            >
              {t.label}
              <span
                className={`text-[11px] font-semibold ${
                  selected
                    ? t.key === "lost"
                      ? "text-sunrise-600"
                      : t.key === "found"
                        ? "text-emerald-600"
                        : "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
            <PackageSearch size={22} />
          </span>
          <p className="mt-3 text-sm font-medium text-navy-900">
            {reports.length === 0 ? "No active reports right now" : "No items in this filter"}
          </p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500">
            {reports.length === 0
              ? `${memberName} hasn&apos;t posted any active lost or found reports yet.`
              : "Try one of the other tabs above."}
          </p>
        </div>
      ) : (
<div className="mt-4 space-y-2.5">
          {visible.map(({ row, kind }) => {
            const image = images[row.id];
            const location = [row.city, row.province].filter(Boolean).join(", ");
            const href = kind === "lost" ? `/lost/${row.id}` : `/found/${row.id}`;
            return (
              <div key={`${kind}-${row.id}`} className="card flex items-center gap-3 p-3 transition hover:shadow-card-hover">
                <Link href={href} className="group flex min-w-0 flex-1 items-center gap-4">
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200/70">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img loading="lazy" src={image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className={`flex h-full w-full items-center justify-center ${
                        kind === "lost" ? "bg-sunrise-50 text-sunrise-500" : "bg-emerald-50 text-emerald-500"
                      }`}>
                        {kind === "lost" ? <PackageSearch size={20} /> : <PackageCheck size={20} />}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-navy-900 group-hover:text-electric-700">{row.title}</p>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        kind === "lost"
                          ? "border-sunrise-200 bg-sunrise-50 text-sunrise-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      }`}>
                        {kind}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                      {row.category ? <span>{CATEGORY_LABELS[row.category as keyof typeof CATEGORY_LABELS] ?? row.category}</span> : null}
                      {location && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="flex items-center gap-1"><MapPin size={11} className="text-slate-400" />{location}</span>
                        </>
                      )}
                      <span className="text-slate-300">·</span>
                      <span>{posted(row.created_at)}</span>
                    </div>
                    {kind === "lost" && row.reward_amount != null && row.reward_amount > 0 && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs font-medium text-amber-600">
                        <Award size={12} />
                        ₱{Number(row.reward_amount).toLocaleString("en-PH")} reward
                      </div>
                    )}
                  </div>
                </Link>

                {/* One-tap message about this item */}
                {!isOwn && (
                  <MessageButton
                    itemType={kind === "lost" ? "lost_item" : "found_item"}
                    itemId={row.id}
                    isOwner={isOwn}
                    label="Message"
                    className="btn-primary shrink-0 !px-3 !py-2 text-xs"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}