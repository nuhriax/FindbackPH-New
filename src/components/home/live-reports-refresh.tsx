"use client";

import { useEffect, useRef, useState } from "react";
import { Radio } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type ConnectionStatus = "connecting" | "live" | "offline";

/**
 * Single realtime subscription for the homepage.
 *
 * Listens to every write on the public `lost_items` and `found_items` tables
 * (INSERT / UPDATE / DELETE) over ONE Supabase channel. When any relevant event
 * arrives it calls `router.refresh()`, which re-runs the homepage Server
 * Component against Supabase and re-renders the report grid — no polling, no
 * manual refresh, no window reload.
 *
 * Kept as a separate stable Client Component so that `router.refresh()`
 * re-renders the surrounding Server Component without remounting (and therefore
 * without duplicating) this subscription.
 */
export function LiveReportsRefresh() {
  const router = useRouter();
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  // Keep the router in a ref so the subscription callback (created once) always
  // refreshes the latest router instance without re-subscribing.
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    const supabase = createClient();

    const refreshHomepage = () => {
      routerRef.current.refresh();
    };

    const channel = supabase
      .channel("homepage-live-reports")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "lost_items" },
        refreshHomepage
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lost_items" },
        refreshHomepage
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "lost_items" },
        refreshHomepage
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "found_items" },
        refreshHomepage
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "found_items" },
        refreshHomepage
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "found_items" },
        refreshHomepage
      )
      .subscribe((subscribeStatus, err) => {
        if (subscribeStatus === "SUBSCRIBED") {
          setStatus("live");
        } else if (
          subscribeStatus === "CHANNEL_ERROR" ||
          subscribeStatus === "TIMED_OUT"
        ) {
          // Connection problem — degrade gracefully instead of crashing.
          // Supabase's client auto-retries, so the indicator can recover on its
          // own once the subscription returns to SUBSCRIBED.
          console.error("Live reports channel error:", err);
          setStatus("offline");
        } else {
          setStatus("connecting");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const connected = status === "live";

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50">
      <div
        role="status"
        aria-live="polite"
        title={
          status === "offline"
            ? "Live report updates are temporarily unavailable"
            : undefined
        }
        className={cn(
          "flex items-center gap-2 rounded-full border bg-white/90 px-3 py-2 text-[11px] font-medium shadow-lg backdrop-blur-md",
          connected
            ? "border-emerald-200 text-emerald-700"
            : status === "offline"
              ? "border-amber-200 text-amber-700"
              : "border-slate-200 text-slate-500"
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            connected
              ? "bg-emerald-500"
              : status === "offline"
                ? "bg-amber-500"
                : "bg-slate-400"
          )}
        />

        <Radio size={12} />

        {connected
          ? "Live reports"
          : status === "offline"
            ? "Reconnecting..."
            : "Connecting..."}
      </div>
    </div>
  );
}
