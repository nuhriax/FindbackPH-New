"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Verify a Cloudflare Turnstile challenge token.
 *
 * This is intentionally ENV-GATED: if NEXT_PUBLIC_TURNSTILE_SITE_KEY /
 * TURNSTILE_SECRET_KEY are not both configured, verifyTurnstile() returns
 * { ok: true } (a no-op) so the app keeps working without Turnstile. Once the
 * team configures Turnstile, protection activates automatically with no code
 * change. No secret is ever hardcoded or exposed to the client.
 *
 * Usage in a server action:
 *   const turnstile = verifyTurnstileAction(formData.get("turnstileToken"));
 *   if (!(await turnstile()).ok) return { error: "Please complete the challenge." };
 */
const TURNSTILE_VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileAction(
  token: FormDataEntryValue | null
): Promise<{ ok: boolean; error?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Not configured -> no-op pass (keeps the app working pre-configuration).
  if (!secret) {
    return { ok: true };
  }

  const value = typeof token === "string" ? token.trim() : "";

  // Empty token while Turnstile is configured -> fail closed.
  if (!value) {
    return { ok: false, error: "missing_token" };
  }

  try {
    const res = await fetch(TURNSTILE_VERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: value }),
    });

    if (!res.ok) {
      console.error("Turnstile verify HTTP error:", res.status);
      // Network/verification failure: fail open to avoid locking out real users
      // when Cloudflare is unreachable, but log for investigation.
      return { ok: true };
    }

    const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };
    if (data.success) {
      return { ok: true };
    }
    console.warn("Turnstile verification failed:", data["error-codes"]);
    return { ok: false, error: "verification_failed" };
  } catch (e) {
    console.error("Turnstile verify exception:", e);
    return { ok: true };
  }
}

/**
 * Server action wrapper used by protected forms. Verifies the Turnstile token
 * AND confirms the request comes from an authenticated session where required.
 * Returns a standardized ActionResult.
 */
export async function requireTurnstile(
  token: FormDataEntryValue | null,
  opts: { requireAuth?: boolean } = {}
): Promise<{ ok: boolean; error?: string }> {
  const turnstile = await verifyTurnstileAction(token);
  if (!turnstile.ok) {
    return { ok: false, error: "Please complete the security challenge and try again." };
  }

  if (opts.requireAuth) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: "You must be signed in." };
    }
  }

  return { ok: true };
}
