"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export type ActionResult = { error: string } | { error?: undefined };

const passwordChecks = [
  { test: (v: string) => v.length >= 8, message: "Password must be at least 8 characters" },
  { test: (v: string) => /[A-Z]/.test(v), message: "Include at least one uppercase letter" },
  { test: (v: string) => /[0-9]/.test(v), message: "Include at least one number" },
];

/**
 * Changes the signed-in user's password via Supabase Auth.
 */
export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const password = formData.get("password")?.toString() ?? "";
  const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

  for (const check of passwordChecks) {
    if (!check.test(password)) {
      return { error: check.message };
    }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in" };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("Password change error:", error);
    return { error: "Could not update password. Please try again." };
  }

  return {};
}

/**
 * Best-effort removal of every Storage object the user owns. DB cascades remove
 * rows, but Supabase Storage files are NOT removed by DB cascades — without
 * this, deleted accounts leave orphaned photos/videos forever (a DPA erasure
 * gap and wasted free-tier storage). All upload paths are scoped under the
 * user's "<auth.uid()>/" folder (avatars: profile.ts / api/avatars, item-images:
 * api/item-images + migration M3's validate_item_image trigger, chat-images and
 * chat-videos: messages/[id]/page.tsx), so listing that one folder per bucket
 * covers everything. Service-role client bypasses storage RLS. Failures are
 * logged, not thrown — account deletion must not fail because of a straggler
 * file (an orphaned object is better than a trapped account).
 */
async function cleanupUserStorage(service: SupabaseClient, userId: string) {
  const buckets = ["item-images", "avatars", "chat-images", "chat-videos"] as const;

  await Promise.all(
    buckets.map(async (bucket) => {
      try {
        // Direct children of "<userId>/" — matches the flat "<userId>/<file>"
        // layout every upload path uses. Legacy flat avatar files
        // ("${userId}.jpg" etc., pre-folder-policy uploads) are also removed.
        const { data: files } = await service.storage.from(bucket).list(userId, {
          limit: 1000,
        });
        const paths = (files ?? [])
          .filter((f) => f.name && f.id) // f.id is null for nested folders
          .map((f) => `${userId}/${f.name}`);
        // Legacy flat avatar paths (best-effort, skipped if absent).
        const legacyAvatars =
          bucket === "avatars"
            ? [`${userId}.jpg`, `${userId}.jpeg`, `${userId}.png`, `${userId}.webp`]
            : [];
        const all = [...paths, ...legacyAvatars];
        if (all.length > 0) {
          const { error } = await service.storage.from(bucket).remove(all);
          if (error) console.error(`Storage cleanup (${bucket}):`, error.message);
        }
      } catch (e) {
        console.error(`Storage cleanup (${bucket}) failed:`, e);
      }
    })
  );
}

/**
 * Permanently deletes the signed-in user's account. Uses the service-role client
 * because deleting an auth user requires elevated privileges that the normal
 * session token cannot grant. Cascade rules remove the profile and reports;
 * cleanupUserStorage removes the Storage files that cascades cannot reach.
 */
export async function deleteAccountAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in" };
  }

  const service = createServiceRoleClient();

  // Storage files must be removed BEFORE the auth user is gone — afterward the
  // folder name (the old user id) is no longer recoverable for this account.
  await cleanupUserStorage(service, user.id);

  const { error } = await service.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("Account deletion error:", error);
    return { error: "Could not delete your account. Please try again." };
  }

  await supabase.auth.signOut();
  redirect("/");
}