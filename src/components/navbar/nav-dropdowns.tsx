"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { Bell, Bookmark, MessageCircle } from "lucide-react";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/client";
import {
  getConversationPreviews,
  getNotifications,
  markNotificationRead,
  type ConversationPreview,
} from "@/lib/actions/messaging";
import {
  getSavedItemPreviews,
  getSavedItemsCount,
  type SavedItemPreview,
} from "@/lib/actions/items";
import type { Notification } from "@/types/database";

/**
 * Messenger-style navbar dropdowns. Clicking the bell or chat icon slides a
 * panel down beneath the navbar pill with recent notifications / conversation
 * previews; a footer link routes to the full page.
 */

const PANEL_BASE =
  "absolute right-0 top-full z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_24px_60px_-20px_rgba(20,34,79,0.45)] backdrop-blur-2xl transition-[opacity,transform] duration-200";
const PANEL_OPEN = "pointer-events-auto translate-y-0 scale-100 opacity-100";
const PANEL_CLOSED = "pointer-events-none -translate-y-1.5 scale-[0.97] opacity-0";

function timeAgo(iso: string) {
  return formatDistanceToNowStrict(new Date(iso));
}

/** Outside-click + Escape dismissal for an open panel. */
function useDismiss(open: boolean, ref: React.RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, ref, close]);
}

/**
 * Auto-close the panel whenever the route changes. The navbar stays mounted
 * across client-side navigations in the App Router, so without this the panel
 * would still be open when "See all" or a row link lands you on the next page.
 */
function useCloseOnNavigate(setOpen: React.Dispatch<React.SetStateAction<boolean>>) {
  const pathname = usePathname();
  // `setOpen` from useState is stable across renders, so this effect fires
  // exactly once per route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);
}

/** Unread-style dot badge. `tone` picks the accent color. */
function Badge({ count, tone = "sunrise" }: { count: number; tone?: "sunrise" | "electric" }) {
  if (count <= 0) return null;
  return (
    <span
      className={clsx(
        "absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white",
        tone === "electric" ? "bg-electric-500" : "bg-sunrise-500"
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

function PanelHeader({ title, seeAllHref }: { title: string; seeAllHref: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 px-4 py-3">
      <h3 className="font-display text-sm font-semibold text-navy-900">{title}</h3>
      <Link href={seeAllHref} className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700">
        See all
      </Link>
    </div>
  );
}

function PanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="skeleton h-3 w-2/3 rounded-full" />
            <div className="skeleton h-3 w-5/6 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications                                                        */
/* ------------------------------------------------------------------ */

export function NotificationDropdown({ initialCount }: { initialCount: number }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [items, setItems] = useState<Notification[] | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useDismiss(open, wrapperRef, () => setOpen(false));
  // Close the panel after navigating away (e.g. clicking "See all" or a row).
  useCloseOnNavigate(setOpen);

  async function refreshCount() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      // Badge mirrors "general" notifications only — messages have their own icon.
      const { count: c } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)
        .neq("type", "new_message");
      setCount(c ?? 0);
    } catch {
      /* badge is non-critical */
    }
  }

  // Keep the badge live via Supabase Realtime (same approach as the old bell).
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("navbar-notifications-panel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          void refreshCount();
          setItems(null); // force a fresh list on next open
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  async function fetchList() {
    try {
      const list = await getNotifications();
      setItems(list.slice(0, 6) as Notification[]);
    } catch {
      setItems([]);
    }
  }

  function toggle() {
    const opening = !open;
    // Fire the fetch in the event handler, NOT inside the setOpen updater.
    // Updaters can be re-invoked by React during render, which was causing
    // "Cannot update a component (Router) while rendering..." console errors.
    if (opening) void fetchList();
    setOpen(opening);
  }

  async function markRowRead(n: Notification) {
    if (n.read) return;
    setItems((prev) =>
      prev ? prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)) : prev
    );
    setCount((c) => Math.max(0, c - 1));
    await markNotificationRead(n.id);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={count > 0 ? `${count} unread notification${count === 1 ? "" : "s"}` : "Notifications"}
        title="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-navy-50 hover:text-navy-800"
      >
        <Bell size={20} />
        <Badge count={count} />
      </button>

      <div role="dialog" aria-label="Recent notifications" className={clsx(PANEL_BASE, open ? PANEL_OPEN : PANEL_CLOSED)}>
        <PanelHeader title="Notifications" seeAllHref="/notifications" />

        {items === null ? (
          <PanelSkeleton />
        ) : items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">You&apos;re all caught up.</p>
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto overscroll-contain py-1.5">
            {items.map((n) => {
              const unread = !n.read;
              return (
                <li key={n.id}>
                  <Link
                    href={n.link ?? "/dashboard"}
                    onClick={() => void markRowRead(n)}
                    className={clsx(
                      "mx-1.5 flex items-start gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-navy-50",
                      unread && "bg-blue-50/60"
                    )}
                  >
                    <span className="mt-0.5 h-2 w-2 shrink-0 self-center">
                      {unread && <span className="block h-2 w-2 rounded-full bg-blue-500" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-navy-900">{n.title}</span>
                      <span className="block truncate text-xs text-slate-600">{n.message}</span>
                      <span className="mt-0.5 block text-[11px] text-slate-400">{timeAgo(n.created_at)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * FindBackMessageIcon — a solid rounded-square chat bubble with a
 * bottom-left tail. Filled with currentColor, sized on a 24x24 grid.
 */
export function FindBackMessageIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Solid rounded-square bubble with a bottom-left tail */}
      <path d="M18 3H6a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h1.5v3.2c0 .42.48.66.82.4L13 18h5a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Messages                                                             */
/* ------------------------------------------------------------------ */

export function MessagesDropdown({ initialCount }: { initialCount: number }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [previews, setPreviews] = useState<ConversationPreview[] | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useDismiss(open, wrapperRef, () => setOpen(false));
  // Close the panel after navigating away (e.g. clicking "See all" or a row).
  useCloseOnNavigate(setOpen);

  async function refreshCount() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { count: c } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)
        .eq("type", "new_message");
      setCount(c ?? 0);
    } catch {
      /* badge is non-critical */
    }
  }

  // New-message notifications flow through the same notifications table.
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("navbar-messages-panel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          void refreshCount();
          setPreviews(null); // force a fresh list on next open
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  async function fetchPreviews() {
    try {
      setPreviews(await getConversationPreviews());
    } catch {
      setPreviews([]);
    }
  }

  function toggle() {
    const opening = !open;
    if (opening) {
      void fetchPreviews();
      void refreshCount();
    }
    setOpen(opening);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={count > 0 ? `${count} unread message${count === 1 ? "" : "s"}` : "Messages"}
        title="Messages"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-navy-50 hover:text-navy-800"
      >
        <MessageCircle size={20} />
        <Badge count={count} />
      </button>

      <div role="dialog" aria-label="Recent conversations" className={clsx(PANEL_BASE, open ? PANEL_OPEN : PANEL_CLOSED)}>
        <PanelHeader title="Messages" seeAllHref="/messages" />

        {previews === null ? (
          <PanelSkeleton rows={5} />
        ) : previews.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No conversations yet.</p>
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto overscroll-contain py-1.5">
            {previews.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className="mx-1.5 flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-navy-50"
                >
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-electric-500 to-electric-600 text-sm font-semibold text-white">
                    {c.other_avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.other_avatar_url} alt="" className="h-9 w-9 object-cover" />
                    ) : (
                      (c.other_name[0]?.toUpperCase() ?? "U")
                    )}
                    {c.has_unread && (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-500" />
                    )}
                  </span>
                  <span className={`min-w-0 flex-1 ${c.has_unread ? "font-semibold text-navy-900" : ""}`}>
                    <span className="block truncate text-sm">{c.other_name}</span>
                    <span className="block truncate text-xs font-normal text-slate-600">
                      {c.latest_body
                        ? c.latest_from_me
                          ? `You: ${c.latest_body}`
                          : c.latest_body
                        : "No messages yet"}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[11px] text-slate-400">{timeAgo(c.updated_at)}</span>
                    <span
                      className={clsx(
                        "mt-0.5 inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                        c.item_type === "lost_item"
                          ? "border-sunrise-200 bg-sunrise-50 text-sunrise-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      )}
                    >
                      {c.item_type === "lost_item" ? "Lost" : "Found"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Saved items                                                          */
/* ------------------------------------------------------------------ */

export function SavedDropdown({ initialCount }: { initialCount: number }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [items, setItems] = useState<SavedItemPreview[] | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useDismiss(open, wrapperRef, () => setOpen(false));
  // Close the panel after navigating away (e.g. clicking "See all" or a row).
  useCloseOnNavigate(setOpen);

  async function refresh() {
    try {
      // Previews and count are independent — fetch both together.
      const [previews, total] = await Promise.all([
        getSavedItemPreviews(),
        getSavedItemsCount(),
      ]);
      setItems(previews);
      setCount(total);
    } catch {
      setItems([]);
    }
  }

  function toggle() {
    const opening = !open;
    if (opening) void refresh();
    setOpen(opening);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={
          count > 0 ? `${count} saved item${count === 1 ? "" : "s"}` : "Saved items"
        }
        className="relative rounded-full p-2.5 text-slate-500 transition-colors hover:bg-navy-50 hover:text-navy-800"
      >
        <Bookmark size={18} />
        <Badge count={count} tone="electric" />
      </button>

      <div role="dialog" aria-label="Saved items" className={clsx(PANEL_BASE, open ? PANEL_OPEN : PANEL_CLOSED)}>
        <PanelHeader title="Saved items" seeAllHref="/saved" />

        {items === null ? (
          <PanelSkeleton rows={4} />
        ) : items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No saved items yet.</p>
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto overscroll-contain py-1.5">
            {items.map((s) => (
              <li key={s.id}>
                <Link
                  href={s.href}
                  className="mx-1.5 flex items-start gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-navy-50"
                >
                  <span
                    className={clsx(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                      s.status === "recovered"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                        : "border-amber-200 bg-amber-50 text-amber-600"
                    )}
                  >
                    <Bookmark size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-navy-900">{s.title}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="truncate">{[s.city, s.province].filter(Boolean).join(", ")}</span>
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-400">{timeAgo(s.created_at)}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-0.5">
                    <span
                      className={clsx(
                        "inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                        s.is_lost
                          ? "border-sunrise-200 bg-sunrise-50 text-sunrise-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      )}
                    >
                      {s.is_lost ? "Lost" : "Found"}
                    </span>
                    <span className="inline-block max-w-[6rem] truncate rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-medium capitalize text-slate-500">
                      {(s.category ?? "other").replace(/_/g, " ")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

