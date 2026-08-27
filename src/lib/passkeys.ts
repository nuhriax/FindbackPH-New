/**
 * Client-side passkey support helpers.
 *
 * SECURITY NOTES:
 * - Kill switch: when NEXT_PUBLIC_PASSKEYS_ENABLED is absent at build time,
 *   PASSKEYS_ENABLED is false and every passkey UI path stays hidden. The
 *   variable must be set explicitly to "on" or "true" to expose the feature.
 * - No cryptography happens in this codebase. Challenge generation, credential
 *   verification and session creation are handled entirely by Supabase Auth.
 */
export const PASSKEYS_ENABLED =
  process.env.NEXT_PUBLIC_PASSKEYS_ENABLED === "on" ||
  process.env.NEXT_PUBLIC_PASSKEYS_ENABLED === "true";

/** True if this browser supports WebAuthn / platform passkey ceremonies. */
export function webAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "PublicKeyCredential" in window &&
    typeof window.PublicKeyCredential === "function"
  );
}

/** Friendly names: 1–120 chars after trimming (Supabase enforces the cap too). */
export function isValidPasskeyName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 120;
}

/**
 * Map SDK/WebAuthn errors to safe, user-friendly messages. Never echoes raw
 * internal errors so no authentication internals leak to the UI.
 */
export function describePasskeyError(err: unknown): string {
  // Browser-level ceremony failures (user cancelled, timeout, etc.)
  if (err instanceof DOMException) {
    switch (err.name) {
      case "NotAllowedError":
        return "Passkey request was cancelled or timed out.";
      case "InvalidStateError":
        return "This passkey is already registered to your account.";
      case "NotSupportedError":
        return "This device or browser doesn't support passkeys.";
      case "SecurityError":
        return "The browser blocked this passkey request for security reasons.";
      default:
        break;
    }
  }

  const message = err instanceof Error ? err.message : String(err ?? "");
  // Supabase Auth error codes (documented passkey error codes)
  if (message.includes("too_many_passkeys"))
    return "You've reached the maximum number of passkeys allowed per account.";
  if (message.includes("webauthn_credential_exists"))
    return "This passkey has already been registered.";
  if (message.includes("webauthn_challenge_expired") || message.includes("webauthn_challenge_not_found"))
    return "The passkey request expired. Please try again.";
  if (message.includes("webauthn_verification_failed"))
    return "The passkey could not be verified. Please try again.";
  if (message.includes("passkey_disabled"))
    return "Passkeys are not available right now.";
  if (message.includes("user_banned"))
    return "This account cannot sign in.";
  if (message.includes("email_not_confirmed"))
    return "Confirm your email address before using a passkey.";

  return "Something went wrong with the passkey request. Please try again or use another sign-in method.";
}
