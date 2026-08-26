"use server";

import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation";
import { getAvatarPublicUrl } from "@/lib/storage";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | { error?: undefined };

const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const AVATAR_MAX_SIZE = 4 * 1024 * 1024; // 4 MB

/**
 * Uploads a profile photo for the signed-in user to the "avatars" bucket and
 * returns its public URL. Re-uploading overwrites the same path so a user
 * never accumulates dangling avatar files.
 */
export async function uploadAvatarAction(formData: FormData): Promise<{ avatarUrl?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to upload a photo" };
  }

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) {
    return { error: "Choose a photo to upload" };
  }

  if (!AVATAR_TYPES.includes(file.type)) {
    return { error: "Only image files (JPEG, PNG, WebP, GIF) are allowed" };
  }
  if (file.size > AVATAR_MAX_SIZE) {
    return { error: "Photo must be smaller than 4 MB" };
  }

  const ext = (file.name.split(".").pop()?.toLowerCase() ?? "jpg").replace(/[^a-z0-9]/g, "");
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  const fileName = `${user.id}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("Avatar upload error:", uploadError);
    return { error: "Could not upload your photo. Please try again." };
  }

  return { avatarUrl: getAvatarPublicUrl(fileName) };
}

/**
 * Removes the signed-in user's stored avatar file and clears the reference.
 */
export async function removeAvatarAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in" };
  }

  // Delete any stored file for this user. Do this first so a failure doesn't
  // leave a broken reference.
  await supabase.storage.from("avatars").remove([`${user.id}.jpg`, `${user.id}.jpeg`, `${user.id}.png`, `${user.id}.webp`, `${user.id}.gif`]);

  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);

  if (error) {
    console.error("Avatar remove error:", error);
    return { error: "Could not remove your photo. Please try again." };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return {};
}

/**
 * Onboarding gate for Google/Facebook sign-ups. OAuth providers don't give us
 * a real name or a chosen username, so new social members MUST complete this
 * before using the dashboard. Only updates the three identity fields — never
 * touches location/bio/avatar (those stay whatever the user later sets).
 */
export async function completeOnboardingAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in" };
  }

  const raw = {
    firstName: formData.get("firstName")?.toString().trim() ?? "",
    lastName: formData.get("lastName")?.toString().trim() ?? "",
    username: formData.get("username")?.toString().trim() ?? "",
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", parsed.data.username)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) {
    return { error: "That username is already taken" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      username: parsed.data.username,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Onboarding profile error:", error);
    return { error: "We couldn't save your details. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return {};
}

/**
 * Updates the signed-in user's public profile. Derives the target id from the
 * session (never trusts a client-supplied id) and enforces a unique username.
 */
export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to update your profile" };
  }

  const raw = {
    firstName: formData.get("firstName")?.toString() ?? "",
    lastName: formData.get("lastName")?.toString() ?? "",
    username: formData.get("username")?.toString() ?? "",
    location: formData.get("location")?.toString() || undefined,
    bio: formData.get("bio")?.toString() || undefined,
    avatarUrl: formData.get("avatarUrl")?.toString() || undefined,
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // If the username changed, make sure it isn't taken by someone else.
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", parsed.data.username)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) {
    return { error: "That username is already taken" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      username: parsed.data.username,
      location: parsed.data.location ?? null,
      bio: parsed.data.bio ?? null,
      avatar_url: parsed.data.avatarUrl || null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Profile update error:", error);
    return { error: "We couldn't save your profile. Please try again." };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return {};
}