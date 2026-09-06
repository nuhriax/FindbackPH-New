"use client";

import { ErrorState } from "@/components/ui/error-state";

/**
 * Route-level error boundary for the admin group — catches render /
 * data failures in admin Server Components and shows a branded retry screen.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(
    "[admin] route error:",
    error.message,
    error.digest ? `(digest: ${error.digest})` : "",
    "\n",
    error.stack
  );

  return (
    <ErrorState
      title="Admin panel hit a snag"
      message="We couldn't load this admin page right now. Your data is safe — give it another go."
      reset={reset}
    />
  );
}
