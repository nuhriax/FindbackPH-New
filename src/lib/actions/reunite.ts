"use server";

import { createClient } from "@/lib/supabase/server";

export type ReuniteResult = { ok: true } | { ok: false; error: string };

/**
 * Phase 16 — "Did it reunite?" three-tap user signal.
 * Stores lightweight feedback from an owner who marked a report as recovered,
 * so the team can measure real platform outcomes (not just posting volume).
 * The callers' form only ever sends true/false + an optional 1–5 rating.
 * Ownership of the report is re-checked before the row is written.
 */
export async function recordReuniteFeedbackAction(
  formData: FormData
): Promise<ReuniteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in" };

  const itemType = formData.get("itemType")?.toString() ?? "";
  const itemId = formData.get("itemId")?.toString() ?? "";
  const reunited = formData.get("reunited")?.toString() ?? "";
  const ratingRaw = Number(formData.get("rating")?.toString() ?? "0");

  if (itemType !== "lost_item" && itemType !== "found_item") {
    return { ok: false, error: "Invalid report type" };
  }
  if (!itemId) return { ok: false, error: "Missing report" };
  if (reunited !== "true" && reunited !== "false") {
    return { ok: false, error: "Invalid answer" };
  }

  // Ownership is enforced by RLS + `.eq("reporter_id", user.id)`.
  const table = itemType === "lost_item" ? "lost_items" : "found_items";
  const { data: owned } = await supabase
    .from(table)
    .select("id")
    .eq("id", itemId)
    .eq("reporter_id", user.id)
    .maybeSingle();
  if (!owned) return { ok: false, error: "Report not found among your reports" };

  const rating = ratingRaw >= 1 && ratingRaw <= 5 ? ratingRaw : null;

  const { error } = await supabase.from("reunite_feedback").insert({
    user_id: user.id,
    item_type: itemType as "lost_item" | "found_item",
    item_id: itemId,
    reunited: reunited === "true",
    rating,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You already gave feedback for this report" };
    }
    console.error("Reunite feedback error:", error);
    return { ok: false, error: "Could not save your feedback. Please try again." };
  }

  return { ok: true };
}