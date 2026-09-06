"use client";

import { ErrorState } from "@/components/ui/error-state";

/**
 * Route-level error boundary for the dashboard group — catches render /
 * data failures in dashboard Server Components and shows a branded retry screen.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(
    "[dashboard] route error:",
    error.message,
    error.digest ? `(digest: ${error.digest})` : "",
    "\n",
    error.stack
  );

  return (
    <ErrorState
      title="Dashboard hit a snag"
      message="We couldn't load your dashboard right now. Your data is safe — give it another go."
      reset={reset}
    />
  );
}
