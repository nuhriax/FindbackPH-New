"use server";

import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | { error?: undefined };

/**
 * Updates the signed-in user's public profile. Derives the target id from the
 * session (never trusts a client-supplied id) and enforces a unique username.
 */
export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const supabase = createClient();
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