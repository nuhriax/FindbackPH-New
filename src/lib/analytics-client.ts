"use client";

/**
 * Browser-side product analytics. Buffers events and flushes them to
 * /api/track with `keepalive: true` so in-flight sends survive navigation and
 * tab close (that's how `report_abandoned` fires when the wizard is exited).
 * Never throws, never blocks the UI, never stores personal content.
 */

import type { ProductArea, ProductEventName } from "@/lib/analytics";

const ENDPOINT = "/api/track";
const FLUSH_SIZE = 10;

type QueuedEvent = {
  event_name: string;
  area: string;
  path: string;
  session_id: string;
  props: Record<string, string | number | boolean | null>;
};

let queue: QueuedEvent[] = [];
let flushing = false;

/** Stable per-tab id so funnels can group a visitor's steps (not a user id). */
function sessionId(): string {
  try {
    const KEY = "fb-analytics-sid";
    let sid = sessionStorage.getItem(KEY);
    if (!sid) {
      sid =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `sid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(KEY, sid);
    }
    return sid;
  } catch {
    return "sid-unavailable";
  }
}

function flush(sync = false) {
  if (flushing || queue.length === 0) return;
  const batch = queue.splice(0, FLUSH_SIZE);
  flushing = true;
  try {
    // keepalive lets the request complete even during page unload.
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    }).catch(() => {
      if (sync) queue.unshift(...batch); // best effort retry on unload-loss
    });
  } catch {
    // Swallow — analytics must never break the page.
  } finally {
    flushing = false;
    if (queue.length > 0) flush();
  }
}

export function track(
  name: ProductEventName,
  area: ProductArea,
  props: Record<string, string | number | boolean | null> = {}
): void {
  try {
    if (typeof window === "undefined") return;
    queue.push({
      event_name: name,
      area,
      path: window.location.pathname.slice(0, 256),
      session_id: sessionId(),
      props,
    });
    if (queue.length >= FLUSH_SIZE) flush();
  } catch {
    // Ignore.
  }
}

/** Immediate flush for unmount/unload paths (e.g. leaving the report wizard). */
export function flushSync(): void {
  flush(true);
}
