"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validation";
import { redirect } from "next/navigation";

export type ActionResult = { error?: string; ok?: true; autoSignIn?: boolean };

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

  // Sign up the user. Metadata travels with the auth user so the
  // `handle_new_user` trigger (see supabase/schema.sql) can fill the profile row.
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        username: parsed.data.username,
      },
      // Route the email-confirmation link through this app's PKCE callback page
      // (the same handler already used by OAuth + password reset) so signup
      // confirmation keeps working regardless of the dashboard's redirect
      // defaults. The `signup=1` marker lets the callback tell a signup
      // confirmation apart from a Google/Facebook OAuth login and route
      // confirmed accounts to the dedicated "email verified" screen. Only set
      // when NEXT_PUBLIC_SITE_URL exists — if it's missing, the value is
      // undefined and Supabase falls back to its dashboard default, so this
      // stays a no-op and never breaks existing auth.
      emailRedirectTo: process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?signup=1`
        : undefined,
    },
  });

  if (error) {
    // Supabase returns an error when it cannot send the confirmation email
    // (bad/missing SMTP credentials, or a sender that Gmail doesn't allow).
    // Show a message that tells the user it's a server-side email problem,
    // otherwise pass through Supabase's generic signup message.
    const message = error?.message ?? error?.toString?.() ?? "";
    if (/confirmation email|email send|smtp/i.test(message)) {
      return {
        error:
          "We couldn't send the confirmation email — the server's email sending (SMTP) isn't working. Check Supabase > Project Settings > Auth > SMTP and confirm the Gmail app password is real (no spaces) and the sender email is allowed, then try again.",
      };
    }
    // Map known Supabase errors to friendly, non-technical messages instead of
    // exposing raw provider errors to the UI.
    if (error.code === "user_already_exists" || /already registered|already exists/i.test(message)) {
      return {
        error:
          "An account with this email already exists. Try logging in instead, or reset your password if you've forgotten it.",
      };
    }
    if (/password/i.test(message) && /characters|least|should be/i.test(message)) {
      return { error: "Password must be at least 8 characters with an uppercase letter and a number." };
    }
    if (/rate limit|too many/i.test(message)) {
      return { error: "Too many attempts. Please wait a few minutes and try again." };
    }
    return { error: "We couldn't create your account right now. Please try again in a moment." };
  }

  // Guarantee a complete profile row. The signup trigger normally creates this,
  // but we upsert it here (service-role, RLS-bypassing) so registration always
  // results in a usable profile — regardless of confirmation settings or whether
  // the trigger fired yet. `onConflict: "id"` keeps it idempotent with the trigger.
  if (data.user?.id) {
    const service = createServiceRoleClient();
    const { error: profileError } = await service
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          username: parsed.data.username,
          first_name: parsed.data.firstName,
          last_name: parsed.data.lastName,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("Profile upsert error:", profileError);
    }
  }

  // If email confirmation is disabled for this project (e.g. local dev), signUp
  // creates an auth session. Signing back in with the same credentials makes that
  // session valid server-side so the UI can route straight to the dashboard.
  let autoSignIn = false;
  if (data.user?.id) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    autoSignIn = !signInError;
  }

  // Redirect to login with a success indicator (or dashboard when auto-signed-in)
  return { ok: true, autoSignIn };
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
    // Give people a direct path when the dashboard "require email confirmation"
    // is on, otherwise fall back to a generic "bad credentials" message.
    if (error.code === "email_not_confirmed") {
      return {
        error: "Your email hasn't been confirmed yet. Check your inbox (and spam) for the confirmation link we sent.",
      };
    }
    return { error: "Incorrect email or password" };
  }

  return { ok: true };
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
  // Only pass redirectTo when the site URL is configured — an undefined env var
  // would otherwise produce a literal "undefined/reset-password" redirect URL.
  const { error } = await supabase.auth.resetPasswordForEmail(
    email,
    process.env.NEXT_PUBLIC_SITE_URL
      ? { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password` }
      : undefined
  );

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
