"use server";

import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | { error?: undefined };

/**
 * Answers are hashed with SHA-256 BEFORE they touch the database, mirroring
 * the comparison done inside Postgres (supabase/trust.sql). Plaintext answers
 * are never stored, logged, or readable back — not even by the owner.
 */
function hashAnswer(raw: string): string {
  // Same normalization as the RPC: lowercase + trim surrounding whitespace.
  return createHash("sha256").update(raw.trim().toLowerCase()).digest("hex");
}

const QUESTION_MIN = 5;
const QUESTION_MAX = 200;
const ANSWER_MAX = 200;

/**
 * Owner creates or replaces the private ownership challenge on THEIR report.
 * Ownership is enforced with `.eq("owner_id", user.id)` and again by RLS in
 * Postgres. Only hashes of the answers are persisted.
 */
export async function saveOwnershipChallengeAction(
  itemType: "lost_item" | "found_item",
  itemId: string,
  question1: string,
  answer1: string,
  question2: string,
  answer2: string
): Promise<ActionResult> {
  if (itemType !== "lost_item" && itemType !== "found_item") {
    return { error: "Invalid report type" };
  }

  const q1 = question1.trim();
  const q2 = question2.trim();
  const a1 = answer1.trim();
  const a2 = answer2.trim();

  if (q1.length < QUESTION_MIN || q1.length > QUESTION_MAX) {
    return { error: `Question 1 must be ${QUESTION_MIN}–${QUESTION_MAX} characters` };
  }
  if (a1.length < 1 || a1.length > ANSWER_MAX) {
    return { error: `Answer 1 must be 1–${ANSWER_MAX} characters` };
  }
  if (q2.length > 0 || a2.length > 0) {
    if (q2.length < QUESTION_MIN || q2.length > QUESTION_MAX) {
      return { error: `Question 2 must be ${QUESTION_MIN}–${QUESTION_MAX} characters (or leave both blank)` };
    }
    if (a2.length < 1 || a2.length > ANSWER_MAX) {
      return { error: `Answer 2 must be 1–${ANSWER_MAX} characters` };
    }
  }
  if (q2.length > 0 && q2.trim().toLowerCase() === q1.toLowerCase()) {
    return { error: "Questions must be different" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in" };

  // Confirm the signed-in user really owns this report before touching the
  // challenge table (RLS re-checks ownership there as well).
  const table = itemType === "lost_item" ? "lost_items" : "found_items";
  const { data: owned } = await supabase
    .from(table)
    .select("id")
    .eq("id", itemId)
    .eq("reporter_id", user.id)
    .maybeSingle();
  if (!owned) return { error: "Report not found among your reports" };

  const row = {
    item_type: itemType,
    item_id: itemId,
    owner_id: user.id,
    question_1: q1,
    answer_1_hash: hashAnswer(a1),
    question_2: q2.length > 0 ? q2 : null,
    answer_2_hash: q2.length > 0 ? hashAnswer(a2) : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("ownership_verifications")
    .upsert(row, { onConflict: "item_type,item_id" });

  if (error) {
    console.error("Ownership challenge save error:", error);
    return { error: "Couldn't save your verification questions. Please try again." };
  }

  revalidatePath(`/lost/${itemId}`);
  revalidatePath(`/found/${itemId}`);
  revalidatePath(`/search/${itemId}`);
  return {};
}

/** Owner removes their challenge entirely. */
export async function deleteOwnershipChallengeAction(
  itemType: "lost_item" | "found_item",
  itemId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in" };

  const { error } = await supabase
    .from("ownership_verifications")
    .delete()
    .eq("item_type", itemType)
    .eq("item_id", itemId)
    .eq("owner_id", user.id);

  if (error) {
    console.error("Ownership challenge delete error:", error);
    return { error: "Couldn't remove your verification questions." };
  }

  revalidatePath(`/lost/${itemId}`);
  revalidatePath(`/found/${itemId}`);
  revalidatePath(`/search/${itemId}`);
  return {};
}

/**
 * Claimant submits answers. The comparison happens INSIDE Postgres via the
 * security-definer RPC — this action never sees stored hashes and can only
 * relay pass/fail. Rate limiting lives in the RPC.
 */
export async function submitOwnershipAnswersAction(
  itemType: "lost_item" | "found_item",
  itemId: string,
  answer1: string,
  answer2: string
): Promise<{ passed: boolean; error?: string }> {
  if (!answer1.trim()) return { passed: false, error: "Please answer the questions" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { passed: false, error: "You must be signed in" };

  const { data, error } = await supabase.rpc("verify_ownership_answers", {
    p_item_type: itemType,
    p_item_id: itemId,
    p_answer_1: answer1,
    p_answer_2: answer2.trim().length > 0 ? answer2 : null,
  });

  if (error) {
    console.error("Ownership verify RPC error:", error);
    return { passed: false, error: "Verification failed. Please try again." };
  }

  const result = data as { passed?: boolean; error?: string | null } | null;

  if (result?.passed) {
    revalidatePath(`/lost/${itemId}`);
    revalidatePath(`/found/${itemId}`);
    revalidatePath(`/search/${itemId}`);
    return { passed: true };
  }
  return { passed: false, error: result?.error ?? "mismatch" };
}
