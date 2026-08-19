"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TriangleAlert } from "lucide-react";

type Provider = "google" | "facebook";

const LOGOS: Record<Provider, React.ReactNode> = {
  google: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.72 4.72 0 0 1-2.05 3.1v2.57h3.32c1.94-1.79 2.95-4.42 2.95-7.52Z"
      />
      <path
        fill="#4285F4"
        d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.3-2.57c-.92.61-2.09.97-3.32.97-2.55 0-4.71-1.72-5.48-4.04H3.1v2.66A9.99 9.99 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.52 13.93A6.01 6.01 0 0 1 6.22 12c0-.67.11-1.32.3-1.93V7.4H3.1a10 10 0 0 0 0 9.2l3.42-2.67Z"
      />
      <path
        fill="#34A853"
        d="M12 6c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.96 9.96 0 0 0 3.1 7.4l3.42 2.67C7.29 7.72 9.45 6 12 6Z"
      />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.4c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07Z"
      />
    </svg>
  ),
};

const LABELS: Record<Provider, string> = {
  google: "Continue with Google",
  facebook: "Continue with Facebook",
};

/**
 * "Continue with Google / Facebook" buttons for the login page.
 * Uses the existing browser Supabase client; providers must be enabled in the
 * Supabase dashboard. Errors surface inline rather than breaking the form.
 */
export function SocialAuthButtons() {
  const [active, setActive] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(provider: Provider) {
    if (active) return;
    setActive(provider);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
    } catch {
      setError("Unable to sign in with that provider right now. Please try again.");
    } finally {
      setActive(null);
    }
  }

  return (
    <>
      {error && (
        <p className="auth-error-block" role="alert">
          <TriangleAlert size={16} aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      <div className="auth-oauth">
        {(["google", "facebook"] as const).map((provider) => (
          <button
            key={provider}
            type="button"
            className="auth-oauth-btn"
            onClick={() => handle(provider)}
            disabled={active !== null}
            aria-busy={active === provider}
          >
            <span className="auth-oauth-icon">{LOGOS[provider]}</span>
            <span>{LABELS[provider]}</span>
          </button>
        ))}
      </div>
      <div className="auth-divider" role="separator">
        <span>or</span>
      </div>
    </>
  );
}
