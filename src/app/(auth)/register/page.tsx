"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { registerAction } from "@/lib/actions/auth";
import { AuthShell } from "@/components/ui/auth-shell";
import { useSearchParams } from "next/navigation";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const registeredParam = searchParams.get("registered") === "true";
  const [registered, setRegistered] = useState(false);

  // Show success message on first render if registered via query param
  useEffect(() => {
    if (registeredParam) {
      setRegistered(true);
    }
  }, [registeredParam]);

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await registerAction(formData);
      if (result?.error) {
        setError(result.error);
      } else if (registeredParam === false) {
        // Redirect to login with registered=true to show success message
        const sp = new URLSearchParams();
        sp.set("registered", "true");
        const url = `/login?${sp.toString()}`;
        window.location.href = url;
      }
    });
  }

  return (
    <AuthShell title="Create your account" subtitle="Join FindBack PH to report and search for items">
      {registered && (
        <div className="mt-6 p-4 bg-green-100 rounded-md text-green-800 text-center">
          <p className="font-medium">Account created successfully!</p>
          <p>Please log in to continue.</p>
        </div>
      )}
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