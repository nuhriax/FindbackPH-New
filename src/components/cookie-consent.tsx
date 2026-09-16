"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * CookieConsent — compact first-party cookie banner.
 *
 * Shown only until the visitor accepts. FindBackPH sets no analytics/ad
 * cookies; the banner copy states exactly what cookies exist (session/auth
 * + security). Accepting records a single first-party consent cookie —
 * non-sensitive, so it's set client-side (not HttpOnly) with SameSite=Lax.
 * The initial visibility is decided on the server (cookies() in the layout)
 * so there is no consent flash or hydration mismatch.
 */

const CONSENT_COOKIE = "fb_cookie_consent";
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function CookieConsent({ visible }: { visible: boolean }) {
  const [open, setOpen] = useState(visible);

  if (!open) return null;

  const accept = () => {
    document.cookie = `${CONSENT_COOKIE}=accepted; path=/; max-age=${CONSENT_MAX_AGE}; samesite=lax`;
    setOpen(false);
  };

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-[70] sm:left-4 sm:right-auto sm:bottom-4 sm:max-w-md"
    >
      <div className="rounded-xl border border-white/10 bg-[#1c1e21]/95 p-4 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.6)] backdrop-blur">
        <div className="flex items-start gap-3">
          {/* Gold dot — brand mark for the banner */}
          <span
            aria-hidden="true"
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-gradient-to-b from-sun-300 to-sun-500 ring-1 ring-white/20"
          />
          <div
            className="min-w-0 text-[13px] leading-relaxed"
            style={{ color: "#d7dce2" }}
          >
            <p className="font-semibold" style={{ color: "#ffffff" }}>
              We use cookies.
            </p>
            <p className="mt-0.5">
              Only the cookies needed to keep FindBackPH working, keep you
              signed in, and protect forms. No trackers, no ad networks.{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-2"
                style={{ color: "#f2b23e" }}
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={accept}
            className="inline-flex min-h-[38px] items-center justify-center rounded-lg bg-sun-400 px-4 text-sm font-bold text-ink shadow-[0_2px_8px_-2px_rgba(239,164,48,0.5)] transition hover:bg-sun-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1e21] active:translate-y-px"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}