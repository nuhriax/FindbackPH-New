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
        } else {
          console.error("Auth callback: code exchange failed:", error.message);
          router.replace("/login?error=callback");
        }
        return;
      }

      if (oauthError) {
        // Social sign-in failed before a session ever existed — this is NOT an
        // expired email link, so surface a matching message.
        if (!cancelled) {
          console.error(
            "Auth callback: provider returned an error:",
            oauthError,
            searchParams.get("error_description")
          );
          router.replace("/login?error=callback&source=oauth");
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