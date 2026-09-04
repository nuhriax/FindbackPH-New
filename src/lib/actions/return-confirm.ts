"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ReturnConfirmResult =
  | { ok: true; total: number; reporterConfirmed: boolean; recovered: boolean }
  | { ok: false; error: string };

/**
 * Trust & Safety (110) — two-sided return confirmation.
 *
 * BOTH sides of a handover confirm "Item returned successfully": the report's
 * reporter and the other conversation party. Participation is verified
 * server-side (reporter OR existing conversation about the item) and AGAIN by
 * the return_confirmations RLS policy. Insert conflicts (already confirmed)
 * are treated as success — confirming twice is never an error.
 *
 * When both sides have confirmed and the actor is the reporter, the report is
 * automatically marked recovered (the existing DB trigger credits
 * successful_returns). If the counterpart confirms first, the reporter is
 * notified so they can confirm too.
 */
export async function confirmReturnAction(
  itemType: "lost_item" | "found_item",
  itemId: string,
  note?: string
): Promise<ReturnConfirmResult> {
  if (itemType !== "lost_item" && itemType !== "found_item") {
    return { ok: false, error: "Invalid report type" };
  }
  if (!itemId) return { ok: false, error: "Missing report" };
  const cleanNote = note?.trim().slice(0, 300) || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in" };

  const table = itemType === "lost_item" ? "lost_items" : "found_items";

  // Relationship check 1: reporter? (RLS hides other users' non-active rows,
  // so a null here simply means "not the reporter".)
  const { data: item } = await supabase
    .from(table)
    .select("id, reporter_id, status")
    .eq("id", itemId)
    .maybeSingle();
  const isReporter = item?.reporter_id === user.id;

  // Relationship check 2: conversation participant?
  let isParticipant = isReporter;
  if (!isParticipant) {
    const { data: convo } = await supabase
      .from("conversations")
      .select("id")
      .eq("item_type", itemType)
      .eq("item_id", itemId)
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
      .limit(1)
      .maybeSingle();
    isParticipant = Boolean(convo);
  }

  if (!isParticipant) {
    return {
      ok: false,
      error: "Only the reporter and members of this report's conversation can confirm a return.",
    };
  }

  const { error: insertError } = await supabase
    .from("return_confirmations")
    .insert({
      item_type: itemType,
      item_id: itemId,
      user_id: user.id,
      note: cleanNote,
    });
  if (insertError && insertError.code !== "23505") {
    console.error("Return confirmation error:", insertError);
    return { ok: false, error: "Couldn't save your confirmation. Please try again." };
  }

  // Who has confirmed so far? (RLS exposes all confirmations to participants.)
  const { data: confirmations } = await supabase
    .from("return_confirmations")
    .select("user_id")
    .eq("item_type", itemType)
    .eq("item_id", itemId);

  const confirmerIds = new Set((confirmations ?? []).map((c) => c.user_id));
  const reporterId = item?.reporter_id ?? null;
  const reporterConfirmed = reporterId ? confirmerIds.has(reporterId) : false;
  const total = confirmerIds.size;

  let recovered = item?.status === "recovered";

  // Both sides confirmed → the reporter (when acting) finalizes the return.
  if (reporterConfirmed && total >= 2 && !recovered) {
    if (isReporter) {
      const { error: updateError } = await supabase
        .from(table)
        .update({ status: "recovered" })
        .eq("id", itemId)
        .eq("reporter_id", user.id);
      if (!updateError) recovered = true;
    } else if (reporterId) {
      // Counterpart confirmed first — nudge the reporter to confirm/mark it.
      await supabase.rpc("notify_user_once", {
        p_user_id: reporterId,
        p_type: "item_returned",
        p_title: "Return confirmed by the other party",
        p_message:
          "The other person confirmed this item was returned successfully. Confirm it on your report to complete the return.",
        p_link: itemType === "lost_item" ? `/lost/${itemId}` : `/found/${itemId}`,
      });
    }
  }

  const path = itemType === "lost_item" ? `/lost/${itemId}` : `/found/${itemId}`;
  revalidatePath(path);
  revalidatePath("/dashboard");
  return { ok: true, total, reporterConfirmed, recovered };
}
