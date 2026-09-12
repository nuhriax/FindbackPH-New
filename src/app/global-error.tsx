"use client";

import { useEffect } from "react";

/**
 * Global error boundary — the last resort. Catches errors thrown in the root
 * layout itself (which a regular error.tsx can't do, since it's a child of
 * the layout). Renders a minimal standalone HTML shell so it works even if
 * the design system CSS or Navbar fails to load.
 *
 * Next.js requires this file's exact name and location.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global] fatal layout error:", error.message, error.digest ?? "", "\n", error.stack);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fbf6ef",
          color: "#2e2417",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "28rem", padding: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "4rem",
              height: "4rem",
              borderRadius: "1.5rem",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              marginBottom: "1.5rem",
            }}
          >
            <span style={{ fontSize: "1.75rem" }} aria-hidden="true">
              ⚠️
            </span>
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              margin: 0,
              marginBottom: "0.5rem",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "#64748b",
              margin: 0,
              marginBottom: "1.5rem",
            }}
          >
            We hit an unexpected problem. Your data is safe — please try again.
          </p>
          <button
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1.5rem",
              borderRadius: "0.75rem",
              backgroundColor: "#0f7b7a",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
