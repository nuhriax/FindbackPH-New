"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell, HeartHandshake, PackageCheck, ShieldAlert } from "lucide-react";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/messaging";
import { useToast } from "@/components/ui/toast";
import type { Notification } from "@/types/database";

function notificationIcon(type: string) {
  if (type === "possible_match") return { Icon: PackageCheck, cls: "border-emerald-200 bg-emerald-50 text-emerald-600" };
  if (type === "moderation_action") return { Icon: ShieldAlert, cls: "border-amber-200 bg-amber-50 text-amber-600" };
  if (type === "item_returned") return { Icon: HeartHandshake, cls: "border-blue-200 bg-blue-50 text-blue-600" };
  return { Icon: Bell, cls: "border-indigo-200 bg-indigo-50 text-indigo-600" };
}

export function NotificationsList({ initial }: { initial: Notification[] }) {
  const [items, setItems] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const unreadCount = items.filter((n) => !n.read).length;

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
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {unreadCount > 0 ? `${unreadCount} unread` : "No unread notifications"}
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

      <div className="space-y-2.5">
        {items.map((n) => {
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
                  {new Date(n.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}