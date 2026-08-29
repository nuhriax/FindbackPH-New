"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Registers one page view for a lost/found report.
 *
 * The increment happens in a hardened SECURITY DEFINER RPC (see
 * supabase/104-item-views.sql): clients can never write `view_count`
 * directly, and this action merely forwards a validated (item_type, id)
 * pair. The caller (ViewCounter) dedupes per browser so refreshes don't
 * inflate the count. Best-effort — failures are swallowed because a missed
 * view is harmless.
 */
export async function incrementItemViewAction(
  itemType: "lost_item" | "found_item",
  itemId: string,
): Promise<void> {
  if (itemType !== "lost_item" && itemType !== "found_item") return;
  if (!/^[0-9a-f-]{36}$/i.test(itemId)) return;

  const supabase = await createClient();
  await supabase.rpc("increment_item_view_count", {
    p_item_type: itemType,
    p_item_id: itemId,
  });
}
