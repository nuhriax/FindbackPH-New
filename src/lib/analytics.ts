import { createClient } from "@/lib/supabase/server";

/**
 * First-party product analytics — shared server-side helpers.
 *
 * Events land in `public.product_events` (see supabase/105-product-events.sql)
 * and are surfaced on /admin/analytics. The catalogue below documents every
 * instrumented moment and the product question it answers. NEVER log message
 * bodies, verification answers, report titles, emails or any other user
 * content — coarse properties only.
 */

export type ProductEventName =
  // Report funnel — where do users abandon reports?
  | "report_started"
  | "report_step"
  | "report_submitted"
  | "report_submit_error"
  | "report_abandoned"
  // Search — which filters do people use?
  | "search_performed"
  // Matching — does it produce useful results?
  | "match_impression"
  | "match_clicked"
  // Ownership verification — do people understand it?
  | "verification_viewed"
  | "verification_attempted"
  | "verification_challenge_created"
  // Messaging — where does it get confusing?
  | "conversation_opened"
  | "message_sent"
  // Site-wide — which devices/screens cause problems?
  | "page_view"
  | "js_error"
  | "rage_click";

export type ProductArea =
  | "reports"
  | "search"
  | "matching"
  | "verification"
  | "messaging"
  | "system";

/**
 * Fire-and-forget server-side event. Safe to call from server components and
 * server actions — every failure is swallowed so analytics can never break a
 * user flow. `props` must contain only coarse, non-personal values.
 */
export async function trackServerEvent(
  name: ProductEventName,
  area: ProductArea,
  props: Record<string, string | number | boolean | null> = {},
  options: { path?: string; sessionId?: string } = {}
): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { headers } = await import("next/headers");
    const h = await headers();

    await supabase.from("product_events").insert({
      event_name: name,
      area: area,
      path: (options.path ?? null)?.slice(0, 256) ?? null,
      session_id: options.sessionId?.slice(0, 64) ?? null,
      user_id: user?.id ?? null,
      props,
      user_agent: h.get("user-agent")?.slice(0, 200) ?? null,
    } as never);
  } catch {
    // Analytics must never break a user flow.
  }
}
