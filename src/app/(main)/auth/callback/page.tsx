"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * OAuth / email-confirmation callback. Supabase redirects here after a user
 * finishes Google/Facebook sign-in or clicks an email-confirmation / password
 * reset link. The URL carries a `code` that must be exchanged for a session
 * (PKCE) — `getSession()` alone does not perform that exchange, so we handle
 * the code explicitly, then route the user to the right place.
 */
export default function CallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    // Safe internal-path helper (rejects external / open redirects).
    const nextRaw = searchParams.get("next");
    const target =
      nextRaw?.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/dashboard";

    async function handle() {
      const code = searchParams.get("code");

      // Provider-level failures (Google/Facebook consent cancelled, misconfigured
      // redirect URI, provider outage…) arrive WITHOUT a code but WITH
      // `error` / `error_code` / `error_description` params from Supabase.
      const oauthError =
        searchParams.get("error") ?? searchParams.get("error_code") ?? null;

      if (code) {
        // Google/Facebook OAuth, email confirmation, or password reset — the
        // `code` is single-use and swapped for a session here.
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (!error) {
          // Signup email-confirmation links carry `signup=1`, so confirmed
          // accounts land on a dedicated "email verified" screen instead of
          // being silently pushed to the dashboard. OAuth and password-reset
          // flows never set this flag, so they keep the existing behavior.
          if (searchParams.get("signup") === "1") {
            router.replace("/verify-success");
          } else {
            router.replace(target);
          }
          router.refresh();
          return;
        }

        console.error("Auth callback: code exchange failed:", error.message);

        // Recovery path: a code can only be exchanged ONCE. If something
        // re-ran the callback (double navigation, extension prefetch, etc.),
        // the first exchange may already have established the session — in
        // that case treat the user as signed in instead of showing an error.
        const { data: existing } = await supabase.auth.getSession();
        if (cancelled) return;
        if (existing.session) {
          router.replace(target);
          router.refresh();
          return;
        }

        router.replace(
          `/login?error=callback&reason=${encodeURIComponent(error.message)}`
        );
        return;
      }

      if (oauthError) {
        // Social sign-in failed before a session ever existed — this is NOT an
        // expired email link, so surface a matching message. Pass through the
        // provider's own error code/description so the login screen can show
        // exactly WHY it failed (e.g. redirect_uri_mismatch).
        if (!cancelled) {
          const desc =
            searchParams.get("error_description") ??
            searchParams.get("error_code") ??
            oauthError;
          console.error(
            "Auth callback: provider returned an error:",
            oauthError,
            searchParams.get("error_description")
          );
          router.replace(
            `/login?error=callback&source=oauth&reason=${encodeURIComponent(desc)}`
          );
        }
        return;
      }

      // No code (e.g. session already consumed elsewhere) — fall back to checking the session.
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        router.replace(target);
        router.refresh();
      } else {
        router.replace("/login?error=callback");
      }
    }

    void handle();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return null;
}