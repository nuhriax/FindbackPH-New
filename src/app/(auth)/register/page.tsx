"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AtSign, Lock, Mail, TriangleAlert, User, UserRound } from "lucide-react";
import { registerAction } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { AuthField } from "@/components/auth/form-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import { SubmitButton, type SubmitStatus } from "@/components/auth/submit-button";
import { SocialAuthButtons } from "@/components/auth/social-auth";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [shake, setShake] = useState(false);
  const [password, setPassword] = useState("");
  const timerRef = useRef<number | null>(null);
  const submittingRef = useRef(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  // If the user is already signed in, skip the registration form.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
      }
    });
  }, [router]);

  async function handleSubmit(formData: FormData) {
    if (submittingRef.current) return;
    // The form uses noValidate (custom password UX), so the native `required`
    // on the checkbox never fires — enforce consent explicitly here AND
    // server-side in registerAction.
    if (formData.get("terms") !== "on") {
      setError("Please agree to the Privacy Policy and Terms of Service.");
      setShake(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setShake(false), 550);
      return;
    }
    submittingRef.current = true;
    setError(null);
    setStatus("loading");
    startTransition(async () => {
      const result = await registerAction(formData);
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
          // When email confirmation is off in Supabase, registration already
          // establishes a session — land on the homepage. Otherwise we
          // send the user to log in (they must confirm their email first).
          if (result?.autoSignIn) {
            router.push("/");
          } else {
            router.push("/login?registered=true");
          }
          router.refresh();
        }, 900);
      }
    });
  }

  return (
    <div className={cn("auth-form", shake && "auth-shake")}>
      <h1 className="auth-title">Create your account</h1>
      <p className="auth-subtitle">Join FindBack PH and help things find their way home.</p>

      <SocialAuthButtons />

      <form action={handleSubmit} className="auth-form-body" noValidate>
        <div className="auth-grid-2">
          <AuthField
            label="First name"
            name="firstName"
            icon={User}
            autoComplete="given-name"
            placeholder="Juan"
            autoFocus
          />
          <AuthField
            label="Last name"
            name="lastName"
            icon={UserRound}
            autoComplete="family-name"
            placeholder="Dela Cruz"
          />
        </div>

        <AuthField
          label="Username"
          name="username"
          icon={AtSign}
          autoComplete="username"
          placeholder="juan.dc"
        />

        <AuthField
          label="Email"
          name="email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@example.com"
        />

        <div>
          <AuthField
            label="Password"
            name="password"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
          />
          {password && <PasswordStrength password={password} />}
        </div>

        <AuthField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          icon={Lock}
          autoComplete="new-password"
        />

        {error && (
          <p className="auth-error-block" role="alert">
            <TriangleAlert size={16} aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        <div className="auth-check" style={{ fontSize: "0.8rem" }}>
          <input id="terms" type="checkbox" name="terms" required aria-required="true" />
          <span className="auth-check-text">
            <label htmlFor="terms" className="auth-check-label">
              I agree to the{" "}
            </label>
            <Link href="/privacy" className="auth-link" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="auth-link" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </Link>
          </span>
        </div>

        <SubmitButton status={status}>
          {status === "success"
            ? "Account created!"
            : status === "loading"
              ? "Creating account…"
              : "Create account"}
        </SubmitButton>
      </form>

      <p className="auth-alt">
        Already have an account?{" "}
        <Link href="/login" className="auth-link">
          Log in
        </Link>
      </p>
    </div>
  );
}