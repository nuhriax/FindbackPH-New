"use client";

import { useState, useTransition } from "react";
import { resetPasswordAction } from "@/lib/actions/auth";
import { AuthShell } from "@/components/ui/auth-shell";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await resetPasswordAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <AuthShell title="Set a new password" subtitle="Enter a new password for your account.">
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="label">
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
          <label htmlFor="confirmPassword" className="label">
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
    </AuthShell>
  );
}
