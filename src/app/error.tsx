"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

/**
 * Root-level error boundary — catches render / data failures that aren't
 * handled by a more specific route-group boundary (e.g. the `(auth)` group
 * routes /login, /register, /forgot-password, /reset-password).
 *
 * Next.js automatically wraps this around the children of the root layout,
 * so any uncaught error in a Server Component or during rendering lands here
 * instead of Next.js's default unstyled crash screen.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      "[root] route error:",
      error.message,
      error.digest ? `(digest: ${error.digest})` : "",
      "\n",
      error.stack
    );
    // Report to Sentry (no-op unless NEXT_PUBLIC_SENTRY_DSN is configured).
    // The digest is what users see on-screen, so it is attached to correlate
    // user support requests with the captured stack trace.
    Sentry.captureException(error, {
      extra: { digest: error.digest ?? null },
    });
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong"
      message="We hit an unexpected problem. Your data is safe — please try again."
      reset={reset}
    />
  );
}
