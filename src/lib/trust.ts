/**
 * Trust & verification signals — Phase 7.
 *
 * Every helper here derives its answer from REAL platform data. Nothing is
 * invented: email confirmation comes from Supabase Auth, successful returns
 * come from the DB counter (incremented only by a trigger when an item
 * actually transitions to `recovered`), and account age comes from
 * profiles.created_at.
 */

export type TrustSignals = {
  /** Supabase Auth confirmed this user's email address. */
  emailVerified: boolean;
  /** Account is at least TRUSTED_MIN_ACCOUNT_DAYS old AND has ≥1 real return. */
  trustedMember: boolean;
};

/** How long an account must exist before "Trusted member" may be shown. */
export const TRUSTED_MIN_ACCOUNT_DAYS = 90;

/**
 * Verified Account — true ONLY when Supabase Auth reports a confirmed email
 * (`email_confirmed_at` is set by Supabase itself; we never set it manually).
 */
export function isEmailVerified(user: {
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
} | null | undefined): boolean {
  return Boolean(user && (user.email_confirmed_at || user.confirmed_at));
}

/**
 * Trusted Member — based purely on observable activity:
 * a real confirmed account that is old enough AND has completed at least one
 * genuine return recorded by the database trigger. No ratings, no invented
 * scores.
 */
export function computeTrustSignals(options: {
  emailVerified: boolean;
  profileCreatedAt: string | null | undefined;
  successfulReturns: number | null | undefined;
}): TrustSignals {
  const { emailVerified, profileCreatedAt, successfulReturns } = options;

  let trustedMember = false;
  if (emailVerified && (successfulReturns ?? 0) > 0 && profileCreatedAt) {
    const ageDays =
      (Date.now() - new Date(profileCreatedAt).getTime()) / 86_400_000;
    trustedMember = ageDays >= TRUSTED_MIN_ACCOUNT_DAYS;
  }

  return { emailVerified, trustedMember };
}

/** Shape of the jsonb returned by the get_ownership_challenge RPC. */
export type OwnershipChallengeState = {
  exists: boolean;
  is_owner: boolean;
  question1: string;
  question2: string | null;
  caller_passed: boolean;
  attempts_left: number;
};

/**
 * Verified Report — only meaningful because we CAN validate something real:
 * the report was posted by an email-confirmed account and carries at least one
 * uploaded photo (photos go through our own Storage upload path). Reports from
 * unconfirmed accounts or without photos simply don't get the badge.
 */
export function isVerifiedReport(emailVerified: boolean, imageCount: number): boolean {
  return emailVerified && imageCount > 0;
}
