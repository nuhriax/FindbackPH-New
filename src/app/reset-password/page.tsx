"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordAction } from "@/lib/actions/auth";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await resetPasswordAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-display text-2xl font-semibold">Set a new password</h1>
      <p className="mt-1 text-sm text-slate-400">
        Enter a new password for your account.
      </p>

      <form action={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-slate-300">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm text-slate-300">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
          />
        </div>

        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={isPending} className="btn-primary w-full">
          {isPending ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
