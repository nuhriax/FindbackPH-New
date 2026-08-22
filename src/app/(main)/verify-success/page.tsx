"use client";

import Link from "next/link";
import { CheckCircle2, Home } from "lucide-react";
import { Logo } from "@/components/logo";

/**
 * Shown after someone clicks the signup email-confirmation link and their
 * account becomes verified. Reuses the auth shell/visual so it feels like a
 * natural part of the sign-up experience, and offers a clear next step
 * (dashboard or back to the homepage) now that the account is ready.
 */
export default function VerifySuccessPage() {
  return (
    <div className="auth-root">
      <div className="auth-shell">
        <div className="auth-brand">
          <Logo />
        </div>

        <section className="auth-card" aria-label="Email verified">
          <div className="auth-page flex flex-col items-center text-center">
            <span
              className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_10px_30px_-12px_rgba(16,185,129,0.6)]"
              aria-hidden="true"
            >
              <CheckCircle2 size={32} strokeWidth={2.2} />
            </span>

            <h1 className="auth-title">Email verified!</h1>
            <p className="auth-subtitle">
              Your FindBack PH account is verified and{" "}
              <span className="font-semibold text-emerald-700">
                ready to use
              </span>
              .
            </p>

            <Link
              href="/dashboard"
              className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-b from-electric-500 to-electric-600 px-6 py-3 text-sm font-medium text-white shadow-[0_8px_24px_-10px_rgba(15,123,122,0.65)] transition-all duration-200 hover:-translate-y-px hover:from-electric-400 hover:to-electric-500"
            >
              Go to Dashboard
            </Link>

            <Link
              href="/"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-navy-900 transition-colors duration-200 hover:border-electric-500 hover:text-electric-600"
            >
              <Home size={16} aria-hidden="true" />
              Back to Home
            </Link>

            <p className="mt-5 text-xs leading-5 text-slate-500">
              You can sign in anytime with your email and password.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}