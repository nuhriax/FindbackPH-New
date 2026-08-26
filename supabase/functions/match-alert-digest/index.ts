// FindBack PH — Match alert digest (scheduled)
//
// Reads each user's persisted alert_preferences (see supabase/101-engagement-alerts.sql)
// and notifies them about fresh FOUND items posted in their chosen city + category.
//
// Why found items? Someone "found" something that might match what the user lost —
// that's the exact intent of "tell me when a possible match is posted."
//
// Delivery (both idempotent via watermark):
//   1. In-app notification through the existing dedupe-safe `notify_user_once` RPC.
//   2. Optional email if RESEND_API_KEY + RESEND_FROM_EMAIL are set (Resend).
//
// Scheduling is wired by supabase/102-schedule-match-alert-digest.sql — a pg_cron job
// that calls this function over HTTP (via pg_net) with the x-webhook-secret header.

import { createClient } from "npm:@supabase/supabase-js@2";

// Verify the caller (pg_cron via pg_net) matches the configured secret. This keeps
// the endpoint from being triggerable by the public internet without the secret.
function isAuthorized(req: Request): boolean {
  const expected = Deno.env.get("WEBHOOK_SECRET") ?? "";
  return expected.length > 0 && req.headers.get("x-webhook-secret") === expected;
}

type AlertPref = {
  user_id: string;
  match_city: string | null;
  match_category: string | null;
  last_notified_at: string | null;
};

const notIn = (v: string | null) => v && v.trim().length > 0 ? v.trim() : null;
const SEND_WINDOW_MS = 20 * 60 * 1000; // look back this far on first run

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  if (!isAuthorized(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    return new Response("Missing env", { status: 500 });
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Optional Resend email. Emails only fire when this is configured.
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const resendFrom = Deno.env.get("RESEND_FROM_EMAIL");

  const now = new Date();
  const defaultWindow = new Date(now.getTime() - SEND_WINDOW_MS);

  const { data: prefs } = await supabase
    .from("alert_preferences")
    .select("user_id, match_city, match_category, last_notified_at")
    .eq("enable_match_alerts", true);

  if (!prefs || prefs.length === 0) {
    return new Response(JSON.stringify({ notified: [], count: 0 }), {
      headers: { "content-type": "application/json" },
    });
  }

  const notified: string[] = [];

  for (const pref of prefs as AlertPref[]) {
    // Cursor: only items posted after the last run. First run uses the window.
    const cursor = pref.last_notified_at
      ? new Date(pref.last_notified_at)
      : defaultWindow;

    let query = supabase
      .from("found_items") // JSON is fine — items table is on the same URL.
      .select("id, title, city, category, created_at")
      .eq("status", "active")
      .gt("created_at", cursor.toISOString())
      .order("created_at", { ascending: false })
      .limit(8);

    const city = notIn(pref.match_city);
    const category = notIn(pref.match_category);
    if (city) query = query.ilike("city", `%${city}%`);
    if (category) query = query.eq("category", category);

    const { data: items } = await query;
    if (!items || items.length === 0) continue;

    // Link target for the notification.
    const first = items[0];
    const link = `/found/${first.id}`;
    const titles = items.map((i: { title: string }) => i.title).slice(0, 3);
    const label =
      titles.length > 1
        ? `${titles[0]} and ${titles.length - 1} more`
        : titles[0];

    const rpc: { error: unknown } = (await supabase.rpc<any>(
      "notify_user_once",
      {
        p_user_id: pref.user_id,
        p_type: "possible_match",
        p_title: "Possible match in your area",
        p_message: `A found item you may care about was just posted: ${label}.`,
        p_link: link,
      }
    )) as { error: unknown };
    void rpc.error; // notify_user_once silently skips duplicates

    // Optional email (Resend) — only fires when RESEND_API_KEY is configured.
    if (resendKey && resendFrom) {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(
          pref.user_id
        );
        const email = authUser?.user?.email;

        // Link to the live site (fall back to the Supabase dashboard URL).
        const siteBase = (Deno.env.get("PUBLIC_SITE_URL") ?? supabaseUrl).replace(
          /\/$/,
          ""
        );
        const itemHref = (i: { id: string }) => `${siteBase}/found/${i.id}`;

        if (email) {
          const payload = {
            from: resendFrom,
            to: [email],
            subject: "Possible match on FindBack PH",
            html: `<p>Hi there,</p>
<p>Something was just found in your alert area (${city ?? "anywhere"}, ${
              category ?? "any category"
            }):</p>
<ul>${items
              .map(
                (i: { title: string; id: string }) =>
                  `<li><strong>${i.title}</strong> — <a href="${itemHref(
                    i
                  )}" style="color:#2563eb">view on FindBack PH</a></li>`
              )
              .join("")}
</ul>
<p>Sign in to FindBack PH to see photos and reach out safely.</p>`,
          };

    // Advance the watermark so this item isn't re-sent next run.
    await supabase
      .from("alert_preferences")
      .update({ last_notified_at: now.toISOString() })
      .eq("user_id", pref.user_id);

    notified.push(pref.user_id);
  }

  return new Response(
    JSON.stringify({ notified, count: notified.length }),
    { headers: { "content-type": "application/json" } }
  );
}