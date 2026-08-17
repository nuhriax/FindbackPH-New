"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { registerAction } from "@/lib/actions/auth";

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
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-display text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-slate-400">Join FindBack PH to report and search for items.</p>

      <form action={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="mb-1 block text-sm text-slate-300">First name</label>
            <input id="firstName" name="firstName" required className="input" />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1 block text-sm text-slate-300">Last name</label>
            <input id="lastName" name="lastName" required className="input" />
          </div>
        </div>

        <div>
          <label htmlFor="username" className="mb-1 block text-sm text-slate-300">Username</label>
          <input id="username" name="username" required className="input" />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-slate-300">Email</label>
          <input id="email" name="email" type="email" required className="input" />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-slate-300">Password</label>
          <input id="password" name="password" type="password" required className="input" />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters, one uppercase letter, one number.</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm text-slate-300">Confirm password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required className="input" />
        </div>

        {error && <p className="field-error" role="alert">{error}</p>}

        <button type="submit" disabled={isPending} className="btn-primary w-full">
          {isPending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="text-electric-400 hover:underline">Log in</Link>
      </p>
    </div>
  );
}
