"use client";

import { ErrorState } from "@/components/ui/error-state";

/**
 * Route-level error boundary for the messages group — catches render /
 * data failures in messaging Server Components and shows a branded retry screen.
 */
export default function MessagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(
    "[messages] route error:",
    error.message,
    error.digest ? `(digest: ${error.digest})` : "",
    "\n",
    error.stack
  );

  return (
    <ErrorState
      title="Messages hit a snag"
      message="We couldn't load your messages right now. Your data is safe — give it another go."
      reset={reset}
    />
  );
}
