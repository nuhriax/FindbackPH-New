"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ItemStatus } from "@/types/database";
import { notifyUserOnce } from "@/lib/notify";


export type ActionResult = { error: string } | { error?: undefined };

/**
 * Verifies the signed-in user has an admin/moderator role server-side.
 * Returns true if authorized, false otherwise.
 */
export async function isAdminUser(): Promise<boolean> {
  const supabase = await createClient();
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
  status: ItemStatus
): Promise<ActionResult> {
  const authorized = await isAdminUser();
  if (!authorized) {
    return { error: "Not authorized" };
  }

  const supabase = await createClient();
  const tableName = itemType === "lost_item" ? "lost_items" : "found_items";

  // Read the current owner first so we can notify them about moderation
  // actions on their own report.
  const { data: existing } = await supabase
    .from(tableName)
    .select("reporter_id, title")
    .eq("id", itemId)
    .single();

  const { error } = await supabase
    .from(tableName)
    .update({ status })
    .eq("id", itemId);

  if (error) {
    console.error("Error updating report status:", error);
    return { error: "Could not update report" };
  }

  // Moderation notification — only on a genuine removal, with safe generic
  // wording. Moderator notes / flag details are NEVER included. Written via
  // the service-role helper: notification inserts are server-only now.
  if (status === "removed" && existing?.reporter_id) {
    await notifyUserOnce({
      userId: existing.reporter_id,
      type: "moderation_action",
      title: "Your report was removed by moderation",
      message: `Your report "${existing.title ?? ""}" was removed by the FindBack PH moderation team because it did not follow the community guidelines. Contact support if you believe this was a mistake.`,
      link: "/dashboard/reports",
    });
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

  const supabase = await createClient();
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
 * Reviews a report flag (advances its moderation status).
 * Only admins/moderators can do this — checked server-side, never trusted
 * from the client. Allowed transitions cover the full review workflow:
 * pending → under_review → resolved / dismissed (plus legacy "reviewed").
 */
export async function reviewFlagAction(
  flagId: string,
  status: "under_review" | "reviewed" | "resolved" | "dismissed"
): Promise<ActionResult> {
  const authorized = await isAdminUser();
  if (!authorized) {
    return { error: "Not authorized" };
  }

  if (!["under_review", "reviewed", "resolved", "dismissed"].includes(status)) {
    return { error: "Invalid status" };
  }

  const supabase = await createClient();
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
 * Reviews a USER report the same way as listing flags.
 * Only admins/moderators can do this.
 */
export async function reviewUserFlagAction(
  flagId: string,
  status: "under_review" | "resolved" | "dismissed"
): Promise<ActionResult> {
  const authorized = await isAdminUser();
  if (!authorized) {
    return { error: "Not authorized" };
  }

  if (!["under_review", "resolved", "dismissed"].includes(status)) {
    return { error: "Invalid status" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("user_flags")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user!.id,
    })
    .eq("id", flagId);

  if (error) {
    console.error("Error reviewing user flag:", error);
    return { error: "Could not update user report" };
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

  // Suspension writes to ANOTHER user's profile row (RLS correctly blocks
  // user sessions from that), so this runs on the service role. The caller's
  // admin/moderator role was verified server-side above; the service key
  // never leaves the server.
  const service = createServiceRoleClient();
  const { error } = await service
    .from("profiles")
    .update({ is_suspended: suspended })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user suspension:", error);
    return { error: "Could not update user" };
  }

  // Real moderation event — generic wording only, never moderator notes.
  if (suspended) {
    await notifyUserOnce({
      userId,
      type: "moderation_action",
      title: "Your account was suspended",
      message:
        "Your FindBack PH account has been suspended by the moderation team due to a violation of the community guidelines. Contact support if you believe this was a mistake.",
      link: "/contact",
    });
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
  const supabase = await createClient();
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
