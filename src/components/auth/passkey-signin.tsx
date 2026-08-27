"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { enforcePasskeyRateLimit } from "@/lib/actions/passkeys";
import {
  PASSKEYS_ENABLED,
  describePasskeyError,
  webAuthnSupported,
} from "@/lib/passkeys";

/**
 * "Sign in with passkey" button for the login page.
 *
 * - Renders nothing unless the kill switch is on AND the browser supports
 *   WebAuthn (graceful fallback to password/OAuth sign-in).
 * - Uses discoverable credentials (no email needed — Supabase resolves the
 *   account from the credential).
 * - The session is created by Supabase Auth itself during verification; no
 *   custom session handling here.
 */
export function PasskeySignIn({ next }: { next: string }) {
  const router = useRouter();
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (PASSKEYS_ENABLED && webAuthnSupported()) setAvailable(true);
  }, []);

  if (!available) return null;

  async function handlePasskeySignIn() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      // Server-side abuse gate before starting a WebAuthn ceremony.
      const limit = await enforcePasskeyRateLimit();
      if (!limit.ok) {
        setError(limit.message ?? "Too many attempts. Please try again later.");
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPasskey();
      if (authError) throw authError;
      // Session is set (cookie-based via @supabase/ssr); hand off to app.
      router.push(next);
      router.refresh();
    } catch (err) {
      setLoading(false);
      setError(describePasskeyError(err));
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handlePasskeySignIn}
        disabled={loading}
        aria-label="Sign in with passkey"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          width: "100%",
        }}
        className="auth-oauth-btn"
      >
        <Fingerprint size={16} aria-hidden="true" />
        {loading ? "Waiting for authenticator…" : "Sign in with Passkey"}
      </button>
      {error && (
        <p className="auth-error-block mt-2" role="alert">
          <TriangleAlert size={16} aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
