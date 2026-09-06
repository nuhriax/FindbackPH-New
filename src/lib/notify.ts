"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Server-side notification writer.
 *
 * `notify_user_once` is a SECURITY DEFINER RPC that can write into ANY user's
 * notification feed. Since the security hardening migration (2026-09-05) its
 * EXECUTE privilege is revoked from anon/authenticated so a signed-in user can
 * never forge system notifications (fake moderation warnings, fake match
 * alerts, phishing links) via direct Supabase calls. All legitimate writers —
 * the matching engine, return flow, moderation actions — live in server-only
 * modules and use this helper, which runs on the service role. The raw key
 * never leaves the server (see createServiceRoleClient in lib/supabase/server).
 *
 * Behavior is unchanged: the RPC still de-duplicates identical UNREAD
 * notifications at the database level.
 */
export async function notifyUserOnce(params: {
  userId: string;
  type: "new_message" | "possible_match" | "report_update" | "item_returned" | "moderation_action";
  title: string;
  message: string;
  link?: string;
}): Promise<void> {
  const service = createServiceRoleClient();
  await service.rpc("notify_user_once", {
    p_user_id: params.userId,
    p_type: params.type,
    p_title: params.title,
    p_message: params.message,
    p_link: params.link ?? null,
  });
}
