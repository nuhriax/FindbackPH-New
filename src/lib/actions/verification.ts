"use server";

/**
 * Phase 8 — identity verification actions.
 *
 * USER SIDE: submitIdVerificationAction uploads a government-ID photo into the
 * PRIVATE id-documents bucket (owner-folder storage RLS) and files a review
 * row. No document content is ever stored in the database — just the storage
 * path, doc type, and the consent timestamp.
 *
 * ADMIN SIDE: reviewIdVerificationAction approves/rejects a pending review.
 * Only service-role code writes review state (RLS grants users no update
 * path), the reviewer is recorded, the member is notified, and the action is
 * logged to the admin audit trail.
 */

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyUserOnce } from "@/lib/notify";
import { isAdminUser, logAdminAction } from "@/lib/actions/admin";

export type ActionResult = { error: string } | { error?: undefined };

const DOC_TYPES = ["philsys", "drivers_license", "passport", "umid", "voters_id"] as const;
type DocType = (typeof DOC_TYPES)[number];

const DOC_LABELS: Record<DocType, string> = {
  philsys: "PhilSys National ID",
  drivers_license: "Driver's License",
  passport: "Passport",
  umid: "UMID",
  voters_id: "Voter's ID",
};

const MAX_FILE_BYTES = 5 * 1024 * 1024; // must match the bucket's file_size_limit
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

/**
 * Submits a government ID for review. Rate-safe by design: a user with a
 * pending or already-approved review cannot submit another one.
 */
export async function submitIdVerificationAction(
  formData: FormData
): Promise<ActionResult> {
  const docType = formData.get("docType")?.toString() ?? "";
  const consent = formData.get("consent")?.toString() === "on";
  const file = formData.get("document");

  if (!DOC_TYPES.includes(docType as DocType)) {
    return { error: "Choose which ID you're submitting." };
  }
  if (!consent) {
    return { error: "Please consent to the privacy terms before submitting." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Attach a clear photo of your ID." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "Image is too large — keep it under 5 MB." };
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return { error: "Use a JPG, PNG, or WebP image." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const service = createServiceRoleClient();

  // One open review (or an approval) at a time.
  const { data: profile } = await service
    .from("profiles")
    .select("id_verification_status")
    .eq("id", user.id)
    .maybeSingle();
  const status = profile?.id_verification_status ?? "none";
  if (status === "pending") {
    return { error: "Your ID is already being reviewed. Hang tight!" };
  }
  if (status === "approved") {
    return { error: "You're already ID verified." };
  }

  // Upload into the owner's private folder. Storage RLS scopes every object to
  // auth.uid()'s folder; the service role is used for the row bookkeeping.
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/${Date.now()}-id.${ext}`;
  const { error: uploadError } = await service.storage
    .from("id-documents")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) {
    console.error("[verification] upload failed:", uploadError.message);
    return { error: "Couldn't upload the image. Please try again." };
  }

  const { error: insertError } = await service
    .from("identity_verifications")
    .insert({
      user_id: user.id,
      doc_type: docType as DocType,
      storage_path: path,
      consent_at: new Date().toISOString(),
    });
  if (insertError) {
    // Roll the orphaned object back so no stray file lingers without a row.
    await service.storage.from("id-documents").remove([path]);
    console.error("[verification] insert failed:", insertError.message);
    return { error: "Couldn't file your review. Please try again." };
  }

  await service
    .from("profiles")
    .update({ id_verification_status: "pending" })
    .eq("id", user.id);

  revalidatePath("/dashboard/settings");
  revalidatePath("/admin/verifications");
  return {};
}

/**
 * Admin decision on a pending ID review. `decision` is approved/rejected;
 * rejections carry a short reason shown to the member.
 */
export async function reviewIdVerificationAction(
  verificationId: string,
  decision: "approved" | "rejected",
  rejectionReason?: string
): Promise<ActionResult> {
  if (!(await isAdminUser())) return { error: "Not authorized" };
  if (decision === "rejected" && !rejectionReason?.trim()) {
    return { error: "Give the member a short reason for the rejection." };
  }

  const service = createServiceRoleClient();

  // Reviewer identity, recorded through the admin's own session.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authorized" };

  const { data: row } = await service
    .from("identity_verifications")
    .select("id, user_id, status, doc_type")
    .eq("id", verificationId)
    .maybeSingle();
  if (!row) return { error: "Review not found." };
  if (row.status !== "pending") {
    return { error: "This submission was already reviewed." };
  }

  const { error: rowError } = await service
    .from("identity_verifications")
    .update({
      status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: decision === "rejected" ? rejectionReason?.trim() : null,
    })
    .eq("id", verificationId);
  if (rowError) {
    console.error("[verification] review update failed:", rowError.message);
    return { error: "Couldn't save the decision. Please try again." };
  }

  await service
    .from("profiles")
    .update({
      id_verification_status: decision,
      ...(decision === "approved" ? { id_verified_at: new Date().toISOString() } : {}),
    })
    .eq("id", row.user_id);

  await notifyUserOnce({
    userId: row.user_id,
    type: "report_update",
    title:
      decision === "approved"
        ? "Your ID was verified ✓"
        : "ID verification needs another look",
    message:
      decision === "approved"
        ? "Your government ID passed review — the ID verified seal is now on your profile."
        : `Your ID couldn't be verified${rejectionReason ? `: ${rejectionReason.trim()}` : ""}. You can submit a clearer photo anytime.`,
    link: "/dashboard/settings",
  });

  await logAdminAction(
    decision === "approved" ? "approve_id_verification" : "reject_id_verification",
    "user",
    row.user_id
  );

  revalidatePath("/admin/verifications");
  revalidatePath("/dashboard/settings");
  return {};
}

