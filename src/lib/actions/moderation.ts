"use server";

import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | { error?: undefined };

const USER_FLAG_REASONS = [
  "scam",
  "harassment",
  "impersonation",
  "suspicious_behavior",
  "inappropriate_content",
  "other",
];

/**
 * Reports another user's behaviour to the moderation team.
 * Server-validated: signed-in users only, cannot target yourself, reason must
 * be one of the allowed enum values. RLS re-checks reporter_id on insert.
 */
export async function reportUserAction(formData: FormData): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to report a user" };
  }

  const targetUserId = formData.get("targetUserId")?.toString() ?? "";
  const reason = formData.get("reason")?.toString() ?? "";
  const details = formData.get("details")?.toString() || null;

  if (!targetUserId) {
    return { error: "Missing user to report" };
  }

  if (targetUserId === user.id) {
    return { error: "You cannot report yourself" };
  }

  if (!USER_FLAG_REASONS.includes(reason)) {
    return { error: "Invalid report reason" };
  }

  // Target must exist.
  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", targetUserId)
    .single();

  if (!target) {
    return { error: "User not found" };
  }

  const { error } = await supabase.from("user_flags").insert({
    reporter_id: user.id,
    target_user_id: targetUserId,
    reason: reason as never,
    details,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You have already reported this user" };
    }
    console.error("User report error:", error);
    return { error: "Could not submit your report" };
  }

  return {};
}

/**
 * Blocks another user. Blocked users can't start new conversations with (or
 * message) you — enforced again inside the messaging actions.
 */
export async function blockUserAction(formData: FormData): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in" };
  }

  const blockedId = formData.get("blockedId")?.toString() ?? "";
  if (!blockedId || blockedId === user.id) {
    return { error: "Invalid user to block" };
  }

  const { error } = await supabase.from("blocked_users").upsert({
    blocker_id: user.id,
    blocked_id: blockedId,
  });

  if (error) {
    console.error("Block user error:", error);
    return { error: "Could not block this user" };
  }

  return {};
}

/** Removes an existing block. */
export async function unblockUserAction(formData: FormData): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in" };
  }

  const blockedId = formData.get("blockedId")?.toString() ?? "";
  if (!blockedId) {
    return { error: "Missing user to unblock" };
  }

  const { error } = await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId);

  if (error) {
    console.error("Unblock user error:", error);
    return { error: "Could not unblock this user" };
  }

  return {};
}

/** Returns true when either side of a pair has blocked the other. */
export async function isBlockedBetween(a: string, b: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("blocked_users")
    .select("blocker_id")
    .or(`and(blocker_id.eq.${a},blocked_id.eq.${b}),and(blocker_id.eq.${b},blocked_id.eq.${a})`)
    .limit(1);

  return (data?.length ?? 0) > 0;
}