"use client";

// ---------------------------------------------------------------------------
// WizardError — error banner that can include an auth-required CTA.
// Shown on every step (not just the current one) so users never see a
// dead-end when something fails.
// ---------------------------------------------------------------------------

import Link from "next/link";
import type { WizardKind } from "../report-wizard-config";

export function WizardError({
  message,
  authRequired,
  kind,
}: {
  message: string;
  authRequired: boolean;
  kind: WizardKind;
}) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
    >
      {message}
      {authRequired && (
        <p className="mt-2">
          <Link
            href={`/login?next=/report/${kind}`}
            className="font-semibold underline underline-offset-2 hover:text-red-800"
          >
            Sign in and try again
          </Link>
        </p>
      )}
    </div>
  );
}