"use server";

import { headers } from "next/headers";
import { createHash } from "crypto";

import { createClient } from "@/lib/supabase/server";

/**
 * Salt for hashing viewer IPs. The raw IP is NEVER stored or shown — only
 * this irreversible hash, used purely for the "1 IP = 1 account" dedupe
 * (migration 108).
 */
const IP_HASH_SALT = "findback-ph-view-ip-v1";

/**
 * Best-effort client IP from proxy headers (Supabase-hosted deploys sit
 * behind a proxy that sets x-forwarded-for). null when unavailable — the
 * RPC then just skips the IP dedupe for that view.
 */
async function getClientIpHash(): Promise<string | null> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    const raw =
      forwarded?.split(",")[0]?.trim() ||
      h.get("x-real-ip")?.trim() ||
      null;
    if (!raw) return null;
    return createHash("sha256").update(IP_HASH_SALT + raw).digest("hex");
  } catch {
    return null;
  }
}

/**
 * Registers one page view for a lost/found report — REAL PEOPLE ONLY.
 *
 * Rules (migration 108):
 *  - Registered accounts only: signed-out visitors, bots and crawlers are
 *    never authenticated, so they can never register a view.
 *  - One view per account per report, across all their devices/browsers.
 *  - One IP address = one account per report (salted-hashed IP; a different
 *    account from the same IP does not count again).
 *
 * The DB ledger is the source of truth; ViewCounter's client key is only a
 * legacy identity and is ignored for signed-in users.
 *
 * Falls back to the legacy 104 RPC (`increment_item_view_count`, no dedupe)
 * while the 105+ migrations haven't run yet - so the counter never breaks.
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
  const ipHash = await getClientIpHash();

  // Owners never count as viewers of their own report — viewing your own
  // listing right after publishing (or any time later) must not inflate the
  // counter or appear in the viewers list.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: owner } = await supabase
      .from(itemType)
      .select("reporter_id")
      .eq("id", itemId)
      .maybeSingle<{ reporter_id: string | null }>();
    if (owner?.reporter_id && owner.reporter_id === user.id) {
      return false;
    }
  }

  // Returns true only when the DB actually counted this view (first time this
  // registered viewer, from this IP, sees this report). Falls back to the
  // legacy per-bump 104 RPC while the 105/106/108 migrations are missing.
  // Owner guard above still applies to the fallback: the owner never counts,
  // even on deployments where only the legacy counter exists.
  const { data, error } = await supabase.rpc("register_item_view", {
    p_item_type: itemType,
    p_item_id: itemId,
    p_viewer_key: typeof viewerKey === "string" ? viewerKey : "",
    p_ip_hash: ipHash,
  });

  if (error && /function public\.register_item_view/i.test(error.message)) {
    // Migrations not applied yet - degrade to the per-bump 104 RPC.
    // Owner already returned false above, so reaching this point means the
    // viewer is NOT the reporter.
    await supabase.rpc("increment_item_view_count", {
      p_item_type: itemType,
      p_item_id: itemId,
    });
    return true;
  }

  return data === true;
}

