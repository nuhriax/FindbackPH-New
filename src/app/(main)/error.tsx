"use client";

import { ErrorState } from "@/components/ui/error-state";

/**
 * Route-level error boundary for the whole `(main)` group — catches render /
 * data failures in Server Components and shows a branded retry screen
 * instead of Next.js's default unstyled one.
 */
export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(
    "[main] route error:",
    error.message,
    error.digest ? `(digest: ${error.digest})` : "",
    "\n",
    error.stack
  );

  return (
    <ErrorState
      title="This page hit a snag"
      message="We couldn't load this page right now. Your data is safe — give it another go."
      reset={reset}
    />
  );
}
