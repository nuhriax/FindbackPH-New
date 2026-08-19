"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, TriangleAlert } from "lucide-react";
import { loginAction } from "@/lib/actions/auth";
import { AuthField } from "@/components/auth/form-field";
import { SubmitButton, type SubmitStatus } from "@/components/auth/submit-button";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [shake, setShake] = useState(false);
  const timerRef = useRef<number | null>(null);
  const submittingRef = useRef(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";

  async function handleSubmit(formData: FormData) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError(null);
    setStatus("loading");
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        submittingRef.current = false;
        setError(result.error);
        setStatus("idle");
        setShake(true);
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setShake(false), 550);
      } else {
        setStatus("success");
        timerRef.current = window.setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 900);
      }
    });
  }

  return (
    <div className={cn("auth-form", shake && "auth-shake")}>
      {registered && (
        <div className="auth-success-block" role="status">
          <span className="auth-check-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Account created — check your email to confirm, then log in below.
        </div>
      )}

      <h1 className="auth-title">Welcome back</h1>
      <p className="auth-subtitle">Log in to reconnect with the things that matter.</p>

      <form action={handleSubmit} className="auth-form-body" noValidate>
        <AuthField
          label="Email"
          name="email"
          type="email"
          icon={Mail}
          autoComplete="email"
          autoFocus
        />

        <div>
          <AuthField
            label="Password"
            name="password"
            type="password"
            icon={Lock}
            autoComplete="current-password"
          />
          <div className="auth-row" style={{ marginTop: "0.75rem" }}>
            <label className="auth-check">
              <input type="checkbox" name="remember" />
              <span>Remember me</span>
            </label>
            <Link href="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </div>
        </div>

        {error && (
          <p className="auth-error-block" role="alert">
            <TriangleAlert size={16} aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        <SubmitButton status={status}>
          {status === "success" ? "Welcome back!" : status === "loading" ? "Signing in…" : "Sign in"}
        </SubmitButton>
      </form>

      <p className="auth-alt">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="auth-link">
          Create one
        </Link>
      </p>
    </div>
  );
}
