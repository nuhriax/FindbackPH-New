"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { registerAction } from "@/lib/actions/auth";
import { AuthShell } from "@/components/ui/auth-shell";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await registerAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <AuthShell title="Create your account" subtitle="Join FindBack PH to report and search for items.">
      <form action={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="label">First name</label>
            <input id="firstName" name="firstName" required className="input" />
          </div>
          <div>
            <label htmlFor="lastName" className="label">Last name</label>
            <input id="lastName" name="lastName" required className="input" />
          </div>
        </div>

        <div>
          <label htmlFor="username" className="label">Username</label>
          <input id="username" name="username" required className="input" />
        </div>

        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" required className="input" />
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" name="password" type="password" required className="input" />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters, one uppercase letter, one number.</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">Confirm password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required className="input" />
        </div>

        {error && <p className="field-error" role="alert">{error}</p>}

        <button type="submit" disabled={isPending} className="btn-primary w-full">
          {isPending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}
