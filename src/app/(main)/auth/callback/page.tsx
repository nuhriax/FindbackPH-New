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

      if (code) {
        // Google/Facebook OAuth, email confirmation, or password reset — the
        // `code` is single-use and swapped for a session here.
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (!error) {
          router.replace(target);
          router.refresh();
        } else {
          router.replace("/login?error=callback");
        }
        return;
      }

      // No code (e.g. OAuth error redirect) — fall back to checking the session.
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