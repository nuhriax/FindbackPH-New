"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Search, SearchX } from "lucide-react";
import { getRailItems, type RailItem } from "@/lib/actions/messaging";

function formatTimeLabel(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const raw = formatDistanceToNow(d, { addSuffix: false });
  return raw === "less than a minute"
    ? "now"
    : raw
        .replace(/^about /, "")
        .replace(/^(\d+)\s+minutes?$/, "$1m")
        .replace(/^(\d+)\s+hours?$/, "$1h")
        .replace(/^(\d+)\s+days?$/, "$1d");
}

/**
 * Client-side chat rail: live search filtering over the server-fetched
 * conversations, Messenger-style. Renders inside the two-pane thread layout.
 */
export function ChatsRail({ activeId }: { activeId: string }) {
  const [items, setItems] = useState<RailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const data = await getRailItems();
      if (alive) {
        setItems(data);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((c) => {
        if (showUnreadOnly && !c.isUnread) return false;
        if (!q) return true;
        return c.displayName.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q);
      })
      .map((c) => ({ ...c, isActive: c.id === activeId }));
  }, [items, query, showUnreadOnly, activeId]);

  const unreadTotal = items.filter((c) => c.isUnread).length;

  if (loading) {
    return (
      <div className="space-y-2 px-2">
        <div className="skeleton h-9 w-full rounded-full" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2">
            <div className="skeleton h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-2/3" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="relative px-2.5 pb-3">
        <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chats"
          aria-label="Search conversations"
          className="w-full rounded-full border border-transparent bg-slate-100 py-2 pl-9 pr-3 text-sm text-navy-900 placeholder:text-slate-400 transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* Unread filter */}
      <div className="flex items-center justify-between px-3.5 pb-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          {filtered.length} chat{filtered.length === 1 ? "" : "s"}
        </p>
        {unreadTotal > 0 && (
          <button
            type="button"
            onClick={() => setShowUnreadOnly((v) => !v)}
            aria-pressed={showUnreadOnly}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              showUnreadOnly
                ? "msg-gradient text-white"
                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
            }`}
          >
            Unread {unreadTotal}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <SearchX size={22} className="text-slate-300" aria-hidden="true" />
          <p className="text-sm text-slate-400">No chats match “{query}”</p>
        </div>
      ) : (
        <ul className="space-y-0.5 px-2">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                href={`/messages/${c.id}`}
                aria-current={c.isActive ? "true" : undefined}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors ${
                  c.isActive
                    ? "bg-blue-50 ring-1 ring-blue-200"
                    : "hover:bg-slate-100/80"
                }`}
              >
                <span className="relative shrink-0">
                  <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full msg-gradient text-sm font-semibold text-white">
                    {c.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      c.initial
                    )}
                  </span>
                  <span aria-hidden="true" className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={`truncate text-sm ${c.isUnread ? "font-bold" : "font-semibold"} text-navy-900`}>
                      {c.displayName}
                    </span>
                    {c.timeLabel && (
                      <span className={`ml-auto shrink-0 text-[11px] ${c.isUnread ? "font-semibold text-blue-600" : "text-slate-400"}`}>
                        {formatTimeLabel(c.timeLabel)}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span className={`min-w-0 flex-1 truncate text-[13px] ${c.isUnread ? "font-semibold text-navy-900" : "text-slate-500"}`}>
                      {c.preview}
                    </span>
                    {c.isUnread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" aria-label="Unread" />}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}