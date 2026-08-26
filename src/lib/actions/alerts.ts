"use server";

import { createClient } from "@/lib/supabase/server";

export type AlertsResult = { ok: true } | { ok: false; error: string };

/**
 * Phase 16 — server-persisted match alerts (the hook that powers "email me
 * when a new possible match is posted"). Stored per user in `alert_preferences`
 * so alerts survive devices/browsers. Sending is handled separately by a
 * scheduled job reading this table; the UI + storage live here.
 */
export async function saveMatchAlertsAction(
  formData: FormData
): Promise<AlertsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in" };

  const enabled = formData.get("enabled")?.toString() === "true";
  const city = (formData.get("city")?.toString() ?? "").trim();
  const category = (formData.get("category")?.toString() ?? "").trim();

  const { error } = await supabase
    .from("alert_preferences")
    .upsert(
      {
        user_id: user.id,
        enable_match_alerts: enabled,
        match_city: city || null,
        match_category: category || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("Match alerts save error:", error);
    return {
      ok: false,
      error:
        "Couldn't save your alert preferences. Please run the " +
        "supabase/101-engagement-alerts.sql migration and try again.",
    };
  }

  return { ok: true };
}