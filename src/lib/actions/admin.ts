"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | { error?: undefined };

/**
 * Verifies the signed-in user has an admin/moderator role server-side.
 * Returns true if authorized, false otherwise.
 */
export async function isAdminUser(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin" || profile?.role === "moderator";
}

/**
 * Updates a report's status (e.g. hide, restore, delete).
 * Only admins/moderators can do this.
 */
export async function updateReportStatusAction(
  itemType: "lost_item" | "found_item",
  itemId: string,
  status: string
): Promise<ActionResult> {
  const authorized = await isAdminUser();
  if (!authorized) {
    return { error: "Not authorized" };
  }

  const supabase = createClient();
  const tableName = itemType === "lost_item" ? "lost_items" : "found_items";

  const { error } = await supabase
    .from(tableName)
    .update({ status })
    .eq("id", itemId);

  if (error) {
    console.error("Error updating report status:", error);
    return { error: "Could not update report" };
  }

  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  return {};
}

/**
 * Deletes a report and related images.
 * Only admins can do this.
 */
export async function deleteReportAction(
  itemType: "lost_item" | "found_item",
  itemId: string
): Promise<ActionResult> {
  const authorized = await isAdminUser();
  if (!authorized) {
    return { error: "Not authorized" };
  }

  const supabase = createClient();
  const tableName = itemType === "lost_item" ? "lost_items" : "found_items";

  const { error } = await supabase.from(tableName).delete().eq("id", itemId);

  if (error) {
    console.error("Error deleting report:", error);
    return { error: "Could not delete report" };
  }

  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  return {};
}

/**
 * Reviews a report flag (marks it reviewed or dismissed).
 * Only admins/moderators can do this.
 */
export async function reviewFlagAction(
  flagId: string,
  status: "reviewed" | "dismissed"
): Promise<ActionResult> {
  const authorized = await isAdminUser();
  if (!authorized) {
    return { error: "Not authorized" };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("report_flags")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user!.id,
    })
    .eq("id", flagId);

  if (error) {
    console.error("Error reviewing flag:", error);
    return { error: "Could not update flag" };
  }

  revalidatePath("/admin/flags");
  revalidatePath("/admin");
  return {};
}

/**
 * Suspends or restores a user account.
 * Only admins can do this.
 */
export async function setUserSuspensionAction(
  userId: string,
  suspended: boolean
): Promise<ActionResult> {
  const authorized = await isAdminUser();
  if (!authorized) {
    return { error: "Not authorized" };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_suspended: suspended })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user suspension:", error);
    return { error: "Could not update user" };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return {};
}

/**
 * Logs an admin action to the audit log.
 */
export async function logAdminAction(
  action: string,
  targetType: string | null,
  targetId: string | null,
  details?: unknown
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("audit_logs").insert({
    admin_id: user.id,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
  });
}
