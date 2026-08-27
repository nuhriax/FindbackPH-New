"use server";

import { consumeRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";

/**
 * Server-side abuse gate for WebAuthn/passkey ceremonies.
 *
 * The cryptographic challenge/verification itself is handled entirely by
 * Supabase Auth (which applies its own auth-endpoint rate limits), but this
 * action reuses the application's existing sliding-window limiter to stop
 * scripts from spamming ceremony starts (challenge generation) at our app
 * before they ever reach Supabase.
 *
 * Returns { ok: true } or { ok: false, message: RATE_LIMIT_MESSAGE }.
 */
export async function enforcePasskeyRateLimit(): Promise<{
  ok: boolean;
  message?: string;
}> {
  // 10 ceremony starts per 10 minutes per IP — generous for humans, hostile
  // to automated flooding. Matches the conservative posture of the other
  // auth endpoints (login 10/15m, register 5/15m).
  const { ok, retryAfterSeconds } = await consumeRateLimit(
    "passkey-ceremony",
    10,
    10 * 60 * 1000
  );
  if (!ok) {
    return {
      ok: false,
      message: `${RATE_LIMIT_MESSAGE} (try again in ~${Math.ceil(
        retryAfterSeconds / 60
      )} minute(s)).`,
    };
  }
  return { ok: true };
}
