"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Registers one page view for a lost/found report - at most ONE per viewer.
 *
 * Dedupe happens server-side in the SECURITY DEFINER RPC
 * `register_item_view` (see supabase/105-item-view-dedupe.sql): the view is
 * only counted the first time a given viewer sees a given report. Viewers
 * are keyed by their auth user id when signed in (one account = one view
 * across all devices/browsers), otherwise by a persistent random browser id.
 *
 * The DB ledger is the source of truth; ViewCounter's client key is just the
 * anonymous fallback identity.
 *
 * Falls back to the legacy 104 RPC (`increment_item_view_count`, no dedupe)
 * while the 105 migration hasn't run yet - so the counter never breaks.
 * Best-effort - failures are swallowed because a missed view is harmless.
 */
export async function incrementItemViewAction(
  itemType: "lost_item" | "found_item",
  itemId: string,
  viewerKey?: string,
): Promise<boolean> {
  if (itemType !== "lost_item" && itemType !== "found_item") return false;
  if (!/^[0-9a-f-]{36}$/i.test(itemId)) return false;

  const supabase = await createClient();

  // Returns true only when the DB actually counted this view (first time this
  // viewer sees this report). Falls back to the legacy per-bump 104 RPC while
  // the 105/106 migrations are missing.
  const { data, error } = await supabase.rpc("register_item_view", {
    p_item_type: itemType,
    p_item_id: itemId,
    p_viewer_key: typeof viewerKey === "string" ? viewerKey : "",
  });

  if (error && /function public\.register_item_view/i.test(error.message)) {
    // 105 migration not applied yet - degrade to the per-bump 104 RPC.
    await supabase.rpc("increment_item_view_count", {
      p_item_type: itemType,
      p_item_id: itemId,
    });
    return true;
  }

  return data === true;
}

