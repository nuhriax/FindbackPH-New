"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/actions/auth";

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
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-display text-2xl font-semibold">Forgot your password?</h1>
      <p className="mt-1 text-sm text-slate-400">
        Enter your email and we'll send you a link to reset your password.
      </p>

      {submitted ? (
        <div className="mt-6">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="text-sm text-emerald-300">
              If an account exists for that email, a reset link has been sent.
              Please check your inbox (and spam folder).
            </p>
          </div>
          <p className="mt-4 text-center text-sm text-slate-400">
            <Link href="/login" className="text-electric-400 hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      ) : (
        <form action={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-slate-300">
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
      )}

      <p className="mt-6 text-center text-sm text-slate-400">
        <Link href="/login" className="text-electric-400 hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
