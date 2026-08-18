"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validation";
import { redirect } from "next/navigation";

export type ActionResult = { error: string } | { error?: undefined };

export async function registerAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    firstName: formData.get("firstName")?.toString() ?? "",
    lastName: formData.get("lastName")?.toString() ?? "",
    username: formData.get("username")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
    confirmPassword: formData.get("confirmPassword")?.toString() ?? "",
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = createClient();

  // Enforce unique username server-side before creating the auth user.
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", parsed.data.username)
    .maybeSingle();

  if (existing) {
    return { error: "That username is already taken" };
  }

  // Sign up the user - without emailRedirectTo so we can create profile and
  // redirect to login immediately. User will need to confirm email later
  // to fully activate account, but can attempt login right away.
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        username: parsed.data.username,
      },
      // Note: We omit emailRedirectTo to allow immediate redirect.
      // User will need to confirm email via the magic link sent to their email.
      // However, they can still attempt to log in with their credentials.
    },
  });

  if (error) {
    // Supabase already returns a safe, user-facing message for signup errors
    // (e.g. "User already registered") — pass it through, never expose internals.
    return { error: error.message };
  }

  // Create profile entry for the newly signed up user.
  // We get the user from the auth session after signUp.
  const { data: { session} } = await supabase.auth.getSession();

  if (session?.user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: session.user.id,
        username: parsed.data.username,
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        role: "user" as const,
        is_suspended: false,
        is_banned: false,
        successful_returns: 0,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Profile creation failure doesn't block the user from seeing
      // the register success page, but login may be limited.
    }
  }

  // Redirect to login with a success indicator
  redirect("/login?registered=true");
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Incorrect email or password" };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// --- Phase 11: Password Reset ---

export async function requestPasswordResetAction(formData: FormData): Promise<ActionResult> {
  const email = formData.get("email")?.toString() ?? "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address" };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  if (error) {
    console.error("Password reset error:", error);
    return { error: "Could not send reset email. Please try again." };
  }

  // Always return success message — don't reveal whether email is registered
  return {};
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const password = formData.get("password")?.toString() ?? "";
  const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { error: "Include at least one uppercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { error: "Include at least one number" };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    console.error("Password reset update error:", error);
    return { error: "Could not update password. Please try again." };
  }

  redirect("/login");
}
