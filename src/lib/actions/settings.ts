"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
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

  const supabase = createClient();
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
 * Permanently deletes the signed-in user's account. Uses the service-role client
 * because deleting an auth user requires elevated privileges that the normal
 * session token cannot grant. Cascade rules remove the profile and reports.
 */
export async function deleteAccountAction(): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in" };
  }

  const service = createServiceRoleClient();
  const { error } = await service.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("Account deletion error:", error);
    return { error: "Could not delete your account. Please try again." };
  }

  await supabase.auth.signOut();
  redirect("/");
}