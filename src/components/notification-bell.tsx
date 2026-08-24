"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Live notification bell for the navbar. Renders the REAL unread count for the
 * signed-in user (server-rendered on first paint, then kept fresh via Supabase
 * Realtime postgres_changes on the `notifications` table, which is a member of
 * the `supabase_realtime` publication). RLS guarantees the user can only ever
 * count their own rows. No badge is shown when there are zero unread items —
 * never a fake indicator.
 */
export function NotificationBell({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function refresh() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      if (!cancelled) setCount(count ?? 0);
    }

    const channel = supabase
      .channel("navbar-notification-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        refresh,
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Link
      href="/notifications"
      aria-label={count > 0 ? `${count} unread notification${count === 1 ? "" : "s"}` : "Notifications"}
      className="relative rounded-full p-2.5 text-slate-500 transition-colors hover:bg-navy-50 hover:text-navy-800"
    >
      <Bell size={18} />
      {count > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sunrise-500 px-1 text-[10px] font-bold leading-none text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
