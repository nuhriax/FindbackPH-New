"use client";

import { cn } from "@/lib/utils";

export type SubmitStatus = "idle" | "loading" | "success";

/**
 * Polished submit button with animated loading spinner and a checkmark
 * success state ("Signing in…" → check + "Welcome back!").
 */
export function SubmitButton({
  status = "idle",
  children,
}: {
  status?: SubmitStatus;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={status !== "idle"}
      className={cn("auth-submit", status === "success" && "auth-submit-success")}
    >
      {status === "loading" && <span className="auth-spinner" aria-hidden="true" />}
      {status === "success" && (
        <svg className="auth-checkmark" viewBox="0 0 24 24" aria-hidden="true">
          <path
            className="auth-checkmark-path"
            d="M4 12.5l5 5L20 6.5"
          />
        </svg>
      )}
      <span>{children}</span>
    </button>
  );
}