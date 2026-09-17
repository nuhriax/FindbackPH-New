"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/**
 * "Who viewed this report" — owner-only panel, Facebook-story style.
 *
 * COLLAPSED (default): one tappable row — overlapping avatar stack +
 * "Seen by N" + rotating chevron. The full list stays hidden until
 * tapped, so the activity rail stays short even with many viewers.
 *
 * Data comes from the item_views ledger via the owner-checked RPC
 * `get_item_viewers`. Only first-time views are recorded.
 */

export type ReportViewer = {
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  isMember: boolean;
  viewedAt: string;
};

export function ReportViewers({ viewers }: { viewers: ReportViewer[] }) {
  const [open, setOpen] = useState(false);

  if (viewers.length === 0) {
    return (
      <section
        aria-label="Report viewers"
        className="rounded-2xl border border-slate-200 bg-white p-4"
      >
        <header className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Eye size={15} />
          </span>
          <h2 className="text-sm font-bold text-slate-900">
            Who viewed this report
          </h2>
        </header>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          No views recorded yet. When people open this report, you&apos;ll see
          who stopped by — one entry per person, even if they come back.
        </p>
      </section>
    );
  }

  const memberCount = viewers.filter((v) => v.isMember).length;
  const anonCount = viewers.length - memberCount;
  const stack = viewers.slice(0, 3);

  return (
    <section
      aria-label="Report viewers"
      className="rounded-2xl border border-slate-200 bg-white p-4"
    >
      {/* Collapsed trigger — story-style avatar stack + count */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="report-viewers-list"
        className="flex w-full items-center gap-3 rounded-xl text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-500/40"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-electric-50 text-electric-600">
          <Eye size={15} />
        </span>

        <span className="flex shrink-0 -space-x-2" aria-hidden="true">
          {stack.map((viewer, i) =>
            viewer.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                loading="lazy"
                src={viewer.avatarUrl}
                alt=""
                className="h-7 w-7 rounded-full object-cover ring-2 ring-white"
              />
            ) : (
              <span
                key={i}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-white ${
                  viewer.isMember ? "bg-electric-500" : "bg-slate-300"
                }`}
              >
                {viewer.isMember
                  ? (viewer.displayName?.[0]?.toUpperCase() ?? "?")
                  : "?"}
              </span>
            ),
          )}
        </span>

        <span className="min-w-0 flex-1 text-sm font-bold text-slate-900">
          Seen by {viewers.length} {viewers.length === 1 ? "person" : "people"}
        </span>

        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <ChevronDown size={13} />
        </span>
      </button>

      {open && (
        <div id="report-viewers-list" className="mt-3">
          <ul className="flex flex-col gap-2">
        {viewers.map((viewer, i) => {
          const initial = viewer.displayName?.[0]?.toUpperCase() ?? "?";

          return (
            <li
              key={`${viewer.username ?? "anon"}-${viewer.viewedAt}-${i}`}
              className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2"
            >
              {viewer.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img loading="lazy"
                  src={viewer.avatarUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  className={
                    viewer.isMember
                      ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-electric-500 text-xs font-semibold text-white"
                      : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-300 text-xs font-semibold text-white"
                  }
                >
                  {viewer.isMember ? initial : "?"}
                </span>
              )}

              <div className="min-w-0 flex-1">
                {viewer.isMember && viewer.username ? (
                  <Link
                    href={`/member/${viewer.username}`}
                    className="block truncate text-sm font-semibold text-slate-900 transition-colors hover:text-electric-700 hover:underline"
                  >
                    {viewer.displayName || viewer.username}
                  </Link>
                ) : (
                  <p className="truncate text-sm font-semibold text-slate-600">
                    {viewer.displayName || "Anonymous visitor"}
                  </p>
                )}
                <p className="text-[11px] text-slate-400">
                  {viewer.isMember ? "Member" : "Signed-out visitor"} · viewed{" "}
                  {formatDistanceToNow(new Date(viewer.viewedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </li>
          );
        })}
          </ul>

          <p className="mt-3 text-[11px] leading-4 text-slate-400">
            Each person is counted once, no matter how many times they return.
            {anonCount > 0
              ? ` ${anonCount} ${anonCount === 1 ? "visitor" : "visitors"} browsed without an account, so FindBack can't show their name.`
              : ""}
          </p>
        </div>
      )}
    </section>
  );
}
