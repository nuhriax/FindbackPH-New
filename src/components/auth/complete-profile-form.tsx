"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboardingAction } from "@/lib/actions/profile";
import { TriangleAlert } from "lucide-react";
import { AuthField } from "@/components/auth/form-field";
import { SubmitButton, type SubmitStatus } from "@/components/auth/submit-button";
import { User, UserRound, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "Complete your profile" gate for Google/Facebook sign-ups. Providers only
 * give us an email + display handle, so new social members choose their real
 * name and username here before reaching the dashboard.
 */
export function CompleteProfileForm({
  defaultFirstName,
  defaultLastName,
  defaultUsername,
}: {
  defaultFirstName: string;
  defaultLastName: string;
  defaultUsername: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [shake, setShake] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    setStatus("loading");
    startTransition(async () => {
      const result = await completeOnboardingAction(formData);
      if (result?.error) {
        setError(result.error);
        setStatus("idle");
        setShake(true);
        if (timer) window.clearTimeout(timer);
        const t = window.setTimeout(() => setShake(false), 550);
        setTimer(t);
        return;
      }
      setStatus("success");
      const t = window.setTimeout(() => {
        router.replace("/dashboard");
        router.refresh();
      }, 700);
      setTimer(t);
    });
  }

  return (
    <div className={cn("auth-form", shake && "auth-shake")}>
      <h1 className="auth-title">Almost there</h1>
      <p className="auth-subtitle">
        Add your real name and pick a username so other members know who
        they&apos;re talking to.
      </p>

      <form action={handleSubmit} className="auth-form-body" noValidate>
        <div className="auth-grid-2">
          <AuthField
            label="First name"
            name="firstName"
            icon={User}
            autoComplete="given-name"
            defaultValue={defaultFirstName}
            required
          />
          <AuthField
            label="Last name"
            name="lastName"
            icon={UserRound}
            autoComplete="family-name"
            defaultValue={defaultLastName}
            required
          />
        </div>

        <AuthField
          label="Username"
          name="username"
          icon={AtSign}
          autoComplete="username"
          defaultValue={defaultUsername}
          required
        />
        <p className="-mt-2 text-xs text-slate-500">
          Letters, numbers, and underscores only (3–30 characters).
        </p>

        {error && (
          <p className="auth-error-block" role="alert">
            <TriangleAlert size={16} aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        <SubmitButton status={status}>
          {status === "success"
            ? "Saved!"
            : status === "loading"
              ? "Saving…"
              : "Continue to Homepage"}
        </SubmitButton>
      </form>
    </div>
  );
}