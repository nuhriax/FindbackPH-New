import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / email-confirmation callback — SERVER-SIDE (route handler).
 *
 * Supabase redirects here after a user finishes Google/Facebook sign-in or
 * clicks an email-confirmation / password-reset link. The URL carries a `code`
 * that must be exchanged for a session (PKCE).
 *
 * WHY SERVER-SIDE: the flows that produce this `code` (signup confirmation,
 * password reset) are initiated from server actions, which store the PKCE code
 * verifier in server-handled cookies. A browser-side exchange reads the
 * verifier from window storage instead, and fails with "PKCE code verifier not
 * found in storage" whenever the cookies don't line up (link opened in another
 * browser/device, cleared storage, chunked-cookie mismatch). Exchanging here,
 * on the server where the verifier lives, removes that entire failure class.
 *
 * This replaces the previous client-side callback page at the same URL.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const supabase = await createClient();

  // Safe internal-path helper (rejects external / open redirects and auth
  // screens as targets). Defaults to the homepage — the post-login landing.
  const nextRaw = url.searchParams.get("next");
  const target =
    nextRaw?.startsWith("/") && nextRaw !== "//" && nextRaw !== "/login" && nextRaw !== "/register"
      ? nextRaw
      : "/";

  const redirectWithPath = (path: string) =>
    NextResponse.redirect(new URL(path, request.url));

  // Provider-level failures (Google/Facebook consent cancelled, misconfigured
  // redirect URI, provider outage…) arrive WITHOUT a code but WITH
  // `error` / `error_code` / `error_description` params from Supabase.
  const oauthError = url.searchParams.get("error") ?? url.searchParams.get("error_code");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Signup email-confirmation links carry `signup=1`, so confirmed
      // accounts land on a dedicated "email verified" screen instead of
      // being silently pushed anywhere else. OAuth and password-reset
      // flows never set this flag, so they keep the existing behavior.
      if (url.searchParams.get("signup") === "1") {
        return redirectWithPath("/verify-success");
      }
      return redirectWithPath(target);
    }

    console.error("Auth callback: code exchange failed:", error.message);

    // Recovery path: a code can only be exchanged ONCE. If something re-ran
    // the callback (double navigation, prefetch, etc.), the first exchange may
    // already have established the session — treat the user as signed in.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      return redirectWithPath(target);
    }

    return redirectWithPath(
      `/login?error=callback&reason=${encodeURIComponent(error.message)}`
    );
  }

  if (oauthError) {
    // Social sign-in failed before a session ever existed — surface the
    // provider's own error code/description so the login screen can show WHY.
    const desc =
      url.searchParams.get("error_description") ??
      url.searchParams.get("error_code") ??
      oauthError;
    console.error("Auth callback: provider returned an error:", oauthError, desc);
    return redirectWithPath(
      `/login?error=callback&source=oauth&reason=${encodeURIComponent(desc)}`
    );
  }

  // No code (e.g. session already consumed elsewhere) — fall back to the session.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return redirectWithPath(session ? target : "/login?error=callback");
}
