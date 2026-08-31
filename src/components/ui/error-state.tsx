"use client";

import { useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Shared, branded error state. Used by route-level `error.tsx` boundaries and
 * anywhere a data fetch fails, so users never see Next.js's default screen.
 */
export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  reset,
}: {
  title?: string;
  message?: string;
  /** Retry callback (passed automatically by error.tsx boundaries). */
  reset?: () => void;
}) {
  const [retrying, setRetrying] = useState(false);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl border border-red-100 bg-red-50 shadow-lg shadow-red-100/50">
        <AlertTriangle size={28} className="text-red-500" aria-hidden="true" />
      </span>
      <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-navy-900">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
      {reset && (
        <button
          type="button"
          onClick={() => {
            setRetrying(true);
            reset();
          }}
          disabled={retrying}
          className="btn-primary mt-6"
        >
          <RotateCcw size={15} aria-hidden="true" className={retrying ? "animate-spin" : ""} />
          {retrying ? "Retrying…" : "Try again"}
        </button>
      )}
    </div>
  );
}
