"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/actions/auth";
import { AuthShell } from "@/components/ui/auth-shell";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSubmitted(false);
    startTransition(async () => {
      const result = await requestPasswordResetAction(formData);
      if (result?.error) setError(result.error);
      else setSubmitted(true);
    });
  }

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we'll send you a link to reset your password.">
      {submitted ? (
        <div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-800">
              If an account exists for that email, a reset link has been sent.
              Please check your inbox (and spam folder).
            </p>
          </div>
          <p className="mt-4 text-center text-sm text-slate-600">
            <Link href="/login" className="font-medium text-blue-600 hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      ) : (
        <>
          <form action={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="input"
              />
            </div>

            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            <Link href="/login" className="font-medium text-blue-600 hover:underline">
              Back to login
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
