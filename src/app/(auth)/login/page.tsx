"use client";

import { Suspense, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, TriangleAlert } from "lucide-react";
import { loginAction } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { AuthField } from "@/components/auth/form-field";
import { SubmitButton, type SubmitStatus } from "@/components/auth/submit-button";
import { SocialAuthButtons } from "@/components/auth/social-auth";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [shake, setShake] = useState(false);
  const timerRef = useRef<number | null>(null);
  const submittingRef = useRef(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";
  // /auth/callback bounces failed email-confirmation/reset links here with
  // ?error=callback — show a friendly explanation instead of a bare form.
  // Failed Google/Facebook sign-ins add &source=oauth so the message matches.
  const callbackFailed = searchParams.get("error") === "callback";
  const callbackWasOauth = searchParams.get("source") === "oauth";
  const oauthReason = searchParams.get("reason");
  // Respect the protected-page redirect the middleware set (e.g. /dashboard),
  // falling back to the dashboard. Reject external/open redirects AND never
  // route a signed-in user back to the home page after login — a `next` of "/"
  // is normalized to /dashboard.
  const rawNext = searchParams.get("next");
  const next =
    rawNext?.startsWith("/") &&
    !rawNext.startsWith("//") &&
    rawNext !== "/" &&
    rawNext !== "/login" &&
    rawNext !== "/register"
      ? rawNext
      : "/dashboard";

  // If a session already exists (e.g. the user just visited a protected page and
  // was bounced here, or is returning while still logged in) skip the form.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace(next);
        router.refresh();
      }
    });
  }, [router, next]);

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
          router.push(next);
          router.refresh();
        }, 900);
      }
    });
  }

  return (
    <div className={cn("auth-form", shake && "auth-shake")}>
      {callbackFailed && (
        <div className="auth-error-block" role="alert">
          <TriangleAlert size={16} aria-hidden="true" />
          {callbackWasOauth ? (
            <>
              <span>
                We couldn&apos;t complete your Google/Facebook sign-in. Please
                try again, or use your email and password instead.
              </span>
            </>
          ) : (
            <span>
              This sign-in link is invalid or has expired. Please try logging in
              again, or request a new link.
            </span>
          )}
          {oauthReason && (
            <span className="mt-1 block text-[11px] opacity-70">
              Reason: {oauthReason}
            </span>
          )}
        </div>
      )}

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

      <h1 className="auth-title">Welcome Back</h1>
      <p className="auth-subtitle">Sign in to your account</p>

      <SocialAuthButtons next={next} />

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
          {status === "success" ? "Welcome back!" : status === "loading" ? "Signing in…" : "Sign in with Email"}
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
