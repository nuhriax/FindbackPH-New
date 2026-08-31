"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell, HeartHandshake, PackageCheck, ShieldAlert } from "lucide-react";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/messaging";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/database";

function notificationIcon(type: string) {
  if (type === "possible_match") return { Icon: PackageCheck, cls: "border-emerald-200 bg-emerald-50 text-emerald-600" };
  if (type === "moderation_action") return { Icon: ShieldAlert, cls: "border-amber-200 bg-amber-50 text-amber-600" };
  if (type === "item_returned") return { Icon: HeartHandshake, cls: "border-blue-200 bg-blue-50 text-blue-600" };
  return { Icon: Bell, cls: "border-blue-200 bg-blue-50 text-blue-600" };
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "match", label: "Matches" },
  { key: "message", label: "Messages" },
  { key: "update", label: "Updates" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

function isMatch(type: string) {
  return type === "possible_match";
}
function isMessage(type: string) {
  return type === "new_message";
}
function matchesFilter(type: string, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "match") return isMatch(type);
  if (filter === "message") return isMessage(type);
  return !isMatch(type) && !isMessage(type);
}

export function NotificationsList({ initial }: { initial: Notification[] }) {
  const [items, setItems] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterKey>("all");
  const { toast } = useToast();

  // Realtime: push new notifications straight into the list as they arrive,
  // no refresh needed. Subscribed once per mount; RLS on `notifications` means
  // Postgres only streams rows the signed-in user can already read. If the
  // realtime feature isn't enabled for the table this degrades gracefully —
  // the server-rendered list is still correct on every page load.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    const supabase = createClient();
    let userId: string | null = null;

    const channel = supabase
      .channel("notifications-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as {
            id: string;
            user_id?: string;
            type?: string;
            title?: string;
            message?: string;
            link?: string | null;
            read?: boolean;
            created_at?: string;
          };
          if (!row?.id || userId !== row.user_id) return;
          if (itemsRef.current.some((n) => n.id === row.id)) return;
          const next: Notification = {
            id: row.id,
            user_id: row.user_id ?? "",
            type: (row.type ?? "update") as Notification["type"],
            title: row.title ?? "Update",
            message: row.message ?? "",
            link: row.link ?? null,
            read: row.read ?? false,
            created_at: row.created_at ?? new Date().toISOString(),
          };
          setItems((prev) => [next, ...prev]);
          toast("success", next.title);
        }
      )
      .subscribe();

    supabase.auth.getUser().then(({ data }) => {
      userId = data.user?.id ?? null;
    });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;
  const filtered = items.filter((n) => matchesFilter(n.type, filter));
  const filteredUnread = filtered.filter((n) => !n.read).length;
  const hasOthers = filtered.length === 0 && items.length > 0;

  function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    startTransition(async () => {
      await markNotificationRead(id);
    });
  }

  function markAll() {
    if (unreadCount === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    startTransition(async () => {
      await markAllNotificationsRead();
      toast("success", "All notifications marked as read");
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-card border border-slate-200/70 bg-white/70 p-12 text-center shadow-soft backdrop-blur-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-600">
          <Bell size={24} />
        </div>
        <h2 className="mt-5 font-display text-lg font-semibold text-navy-900">You&apos;re all caught up</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
          We&apos;ll notify you here when there are matches, messages, or updates to your reports.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={
              filter === f.key
                ? "rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-sm font-medium text-blue-700"
                : "rounded-full border border-transparent px-3.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-white/70 hover:text-blue-700"
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {filteredUnread > 0 ? `${filteredUnread} unread` : "No unread notifications"}
        </p>
        <button
          type="button"
          onClick={markAll}
          disabled={unreadCount === 0 || isPending}
          className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Updating…" : "Mark all as read"}
        </button>
      </div>

      {hasOthers ? (
        <div className="rounded-card border border-slate-200/70 bg-white/70 p-10 text-center shadow-soft backdrop-blur-md">
          <h3 className="font-display text-base font-semibold text-navy-900">Nothing in this category</h3>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-600">
            No notifications of this type yet. Try another filter, or check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((n) => {
            const { Icon, cls } = notificationIcon(n.type);
            const isRead = !!n.read;
            return (
              <Link
                key={n.id}
                href={n.link ?? "/dashboard"}
                onClick={() => {
                  if (!isRead) markRead(n.id);
                }}
                className={`card flex items-start gap-4 p-4 transition-all duration-200 hover:-translate-y-px hover:shadow-card-hover ${
                  isRead ? "opacity-70" : "border-blue-200/80"
                }`}
              >
                <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${cls}`}>
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-navy-900">{n.title}</h3>
                    {!isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                  <span className="mt-1.5 inline-block text-xs text-slate-500">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}