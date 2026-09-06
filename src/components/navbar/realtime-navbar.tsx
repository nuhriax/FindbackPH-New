"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { Navbar } from "@/components/navbar";

/**
 * Wraps the server-rendered Navbar with live badge counts. The initial counts
 * stream in from the server (so the first paint is correct); this layer then
 * subscribes to the notifications + saved_items tables and re-queries the
 * unread totals on every change, so the bell / chat / bookmark badges update
 * the instant something happens — no refresh needed.
 */
export function RealtimeNavbar({
  user,
  profile,
  notificationCount,
  messageCount,
  savedCount,
}: {
  user: User | null;
  profile: Profile | null;
  notificationCount: number;
  messageCount: number;
  savedCount: number;
}) {
  const [counts, setCounts] = useState({
    general: notificationCount,
    messages: messageCount,
    saved: savedCount,
  });

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    const refresh = async () => {
      const [messagesRes, othersRes, savedRes] = await Promise.all([
        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("read", false)
          .eq("type", "new_message"),
        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("read", false)
          .neq("type", "new_message"),
        supabase
          .from("saved_items")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);
      setCounts({
        messages: messagesRes.count ?? 0,
        general: othersRes.count ?? 0,
        saved: savedRes.count ?? 0,
      });
    };

    const channel = supabase
      .channel("navbar-badges")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "saved_items", filter: `user_id=eq.${user.id}` },
        refresh,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <Navbar
      user={user}
      profile={profile}
      notificationCount={counts.general}
      messageCount={counts.messages}
      savedCount={counts.saved}
    />
  );
}
