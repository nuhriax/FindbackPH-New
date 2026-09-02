"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reportUserAction } from "@/lib/actions/moderation";
import { useToast } from "@/components/ui/toast";
import { CheckCircle2, Flag, X } from "lucide-react";

// Values must match the flag_reason enum in the database (user-safe subset).
const REASONS: { label: string; value: string }[] = [
  { label: "Scam", value: "scam" },
  { label: "Harassment", value: "harassment" },
  { label: "Impersonation", value: "impersonation" },
  { label: "Suspicious behaviour", value: "suspicious_behavior" },
  { label: "Inappropriate content", value: "inappropriate_content" },
  { label: "Other", value: "other" },
];

/**
 * "Report this user" — files a user_flags row against the reporter of a
 * listing. Mirrors ReportFlagButton's look and flow. Server actions validate
 * everything again (auth, not-self target, reason enum).
 */
export function UserReportButton({ targetUserId }: { targetUserId: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function handleSubmit(formData: FormData) {
    formData.set("targetUserId", targetUserId);
    setError(null);
    startTransition(async () => {
      const result = await reportUserAction(formData);
      if (result?.error) {
        if (result.error === "You must be signed in to report a user") {
          router.push("/login");
          return;
        }
        if (result.error === "You have already reported this user") {
          setOpen(false);
          setDone(true);
          toast("info", "You've already reported this user. Our team will review it.");
          return;
        }
        setError(result.error);
      } else {
        setOpen(false);
        setDone(true);
        toast("success", "Thank you. This user has been reported for review.");
      }
    });
  }

  if (done) {
    return (
      <p className="flex items-center gap-2 text-sm text-emerald-700">
        <CheckCircle2 size={16} aria-hidden="true" />
        Reported
      </p>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 transition-colors hover:text-red-600"
      >
        <Flag size={14} aria-hidden="true" />
        Report this user
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-navy-900/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <form
            action={handleSubmit}
            role="dialog"
            aria-modal="true"
            aria-label="Report this user"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-card border border-slate-200/70 bg-white p-6 shadow-soft fade-in"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-navy-900">Report this user</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Tell our moderation team what happened. Reports are private.
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy-900"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="user-flag-reason" className="label">Reason</label>
                <select id="user-flag-reason" name="reason" required className="input" defaultValue="">
                  <option value="" disabled>
                    Select a reason…
                  </option>
                  {REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="user-flag-details" className="label">Details (optional)</label>
                <textarea
                  id="user-flag-details"
                  name="details"
                  rows={4}
                  placeholder="Add anything that will help our reviewers…"
                  className="input resize-y"
                  maxLength={1000}
                />
              </div>

              {error && <p className="field-error" role="alert">{error}</p>}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" disabled={isPending} className="btn-primary">
                {isPending ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
