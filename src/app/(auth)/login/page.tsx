"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions/auth";
import { AuthShell } from "@/components/ui/auth-shell";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your FindBack PH account.">
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" required className="input" />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="password" className="label !mb-0">Password</label>
            <Link href="/forgot-password" className="text-xs font-medium text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input id="password" name="password" type="password" required className="input" />
        </div>

        {error && <p className="field-error" role="alert">{error}</p>}

        <button type="submit" disabled={isPending} className="btn-primary w-full">
          {isPending ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-blue-600 hover:underline">Create one</Link>
      </p>
    </AuthShell>
  );
}
