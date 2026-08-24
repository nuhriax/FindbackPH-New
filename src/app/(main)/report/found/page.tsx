"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle2, Lock, ShieldCheck, AlertTriangle, XCircle } from "lucide-react";
import { createFoundItemAction } from "@/lib/actions/items";
import { uploadItemImagesClient } from "@/lib/file-upload-client";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";
import { ImageUpload } from "@/components/image-upload";
import { MotionReveal } from "@/components/effects/motion-reveal";

const STEPS = 4;

type ReviewSnapshot = {
  title: string;
  category: string;
  description: string;
  date: string;
  city: string;
  province: string;
  approximateLocation: string;
  currentHoldingInfo: string;
};

export default function ReportFoundPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<File[]>([]);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  // Read-only summary shown on the Review step so users see exactly what
  // will be published before they commit.
  const [review, setReview] = useState<ReviewSnapshot | null>(null);
  // Set when the server tells us the session expired mid-flow, so we can
  // offer a sign-in link instead of a dead-end error.
  const [authRequired, setAuthRequired] = useState(false);

  // Validate the currently visible step before moving forward. Hidden
  // (display:none) fields are skipped by native browser validation, so without
  // this a user could reach Step 3 with empty required fields.
  function goToStep(next: number) {
    setError(null);
    if (next > step) {
      const container = document.getElementById(`step-${step}`);
      if (container) {
        for (const el of Array.from(
          container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
            "input, textarea, select"
          )
        )) {
          if (!el.checkValidity()) {
            el.reportValidity();
            return;
          }
          // Block whitespace-only values on required text fields.
          if (
            (el.name === "title" || el.name === "description") &&
            el.value.trim().length === 0
          ) {
            el.setCustomValidity(
              el.name === "title"
                ? "Please enter an item name (spaces don't count)."
                : "Please describe the item (spaces don't count)."
            );
            el.reportValidity();
            el.setCustomValidity("");
            return;
          }
        }
      }
    }
    // Snapshot the form into a read-only summary for the Review step.
    if (next === STEPS && next > step) {
      const form = document.getElementById(
        "found-report-form"
      ) as HTMLFormElement | null;
      if (form) {
        const fd = new FormData(form);
        setReview({
          title: fd.get("title")?.toString() ?? "",
          category: fd.get("category")?.toString() ?? "",
          description: fd.get("description")?.toString() ?? "",
          date: fd.get("dateFound")?.toString() ?? "",
          city: fd.get("city")?.toString() ?? "",
          province: fd.get("province")?.toString() ?? "",
          approximateLocation: fd.get("approximateLocation")?.toString() ?? "",
          currentHoldingInfo: fd.get("currentHoldingInfo")?.toString() ?? "",
        });
      }
    }
    setStep(Math.min(STEPS, Math.max(1, next)));
  }

  async function handleSubmit(formData: FormData) {
    if (step !== STEPS) return;

    const form = document.getElementById(
      "found-report-form"
    ) as HTMLFormElement | null;
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Server-side schema also trims; these give instant, friendly feedback.
    const title = formData.get("title")?.toString() ?? "";
    const description = formData.get("description")?.toString() ?? "";
    if (title.trim().length < 3) {
      setError("Please enter an item name (at least 3 characters — spaces don't count).");
      setStep(1);
      return;
    }
    if (description.trim().length < 10) {
      setError("Please describe the item in at least 10 characters (spaces don't count).");
      setStep(1);
      return;
    }
    if (images.length === 0) {
      setError("Please add at least one photo before submitting.");
      return;
    }
    // Selected photos are uploaded separately, after the report is saved.
    // Server Actions can't accept File objects, so files are sent to the
    // /api/item-images route handler instead.
    setError(null);
    startTransition(async () => {
      const result = await createFoundItemAction(formData);
      if (result?.error) {
        setError(result.error);
        if (/signed in/i.test(result.error)) setAuthRequired(true);
        return;
      }
      if (!result?.itemId) {
        setError("We couldn't save your report. Please try again.");
        return;
      }

      const uploadErr = await uploadItemImagesClient(
        "found_item",
        result.itemId,
        images
      );
      if (uploadErr) {
        // Roll back the just-created report so a failed photo upload doesn't
        // leave an orphan report behind.
        try {
          await fetch(`/api/items/${result.itemId}`, { method: "DELETE" });
        } catch {
          /* best effort */
        }
        setError(uploadErr);
        return;
      }

      setConfirmedId(result.itemId);
    });
  }

  if (confirmedId) {
    return (
      <div className="relative py-16 lg:py-24">
        {/* Celebratory glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-8 h-72 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-emerald-300/25 blur-3xl"
        />
        <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
          <MotionReveal>
            <span className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <span
                aria-hidden="true"
                className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-30"
              />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg shadow-emerald-200/50">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </span>
            </span>
          </MotionReveal>

          <MotionReveal delay={80}>
            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
              Thank you — your found report is{" "}
              <span className="bg-gradient-to-r from-blue-600 via-electric-500 to-violet-500 bg-clip-text text-transparent">
                live!
              </span>
            </h1>
          </MotionReveal>

          <MotionReveal delay={150}>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
              You just made someone&apos;s day possible. When your report matches
              a lost report, we&apos;ll flag it and help you arrange a safe
              return.
            </p>
          </MotionReveal>

          <MotionReveal delay={220}>
            <ol className="mx-auto mt-9 flex max-w-md flex-col gap-3 text-left">
              {[
                ["It's visible", "Your report is now public to people searching the community."],
                ["We help it match", "If a lost report seems to match, we flag it as a possible match."],
                ["Safe return", "Confirm ownership details and arrange a safe, public handover."],
              ].map(([t, d], i) => (
                <li
                  key={t}
                  className="group flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-[11px] font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{t}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </MotionReveal>

          <MotionReveal delay={290}>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={`/found/${confirmedId}`} className="btn-primary">
                View your report
              </Link>
              <Link href="/search" className="btn-secondary">
                Search for matches
              </Link>
            </div>
            <div className="mt-3 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setConfirmedId(null);
                  setStep(1);
                  setReview(null);
                  setImages([]);
                }}
                className="btn-secondary"
              >
                Report another item
              </button>
              <Link href="/" className="btn-secondary">
                Return home
              </Link>
            </div>
          </MotionReveal>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="text-center">
          <span className="eyebrow !border-emerald-200 !bg-emerald-50 !text-emerald-700">Found something?</span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
            Report a found item
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            Thank you for helping return this item to its owner. Every report brings
            something one step closer to home.
          </p>

          {/* Journey — REPORT → VERIFY → CONNECT → RETURN */}
          <ol
            aria-label="How returning works"
            className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-x-1.5 gap-y-2"
          >
            {[
              ["Report", "Describe what you found"],
              ["Verify", "We check ownership together"],
              ["Connect", "Message through FindBack"],
              ["Return", "Safe, public handover"],
            ].map(([label, hint], i, arr) => (
              <li key={label} className="flex items-center gap-1.5">
                <span
                  title={hint}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700 backdrop-blur"
                >
                  {label}
                </span>
                {i < arr.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="h-px w-4 bg-emerald-200 sm:w-6"
                  />
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* Progress steps */}
        <div className="mt-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  s <= step
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                    : "bg-emerald-100"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
            {step === 1
              ? "Step 1 · Describe the item"
              : step === 2
                ? "Step 2 · Where & when"
                : step === 3
                  ? "Step 3 · Photos"
                  : "Step 4 · Review & submit"}
          </p>
        </div>

        <form
          id="found-report-form"
          action={handleSubmit}
          onKeyDown={(e) => {
            // Block Enter-to-submit from single-line inputs so users can't
            // skip ahead of the multi-step wizard accidentally.
            if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
              e.preventDefault();
            }
          }}
          className="card mt-6 p-6 sm:p-8"
        >
          <div id="step-1" className={step === 1 ? "space-y-5" : "space-y-5 hidden"}>
              <div>
                <label htmlFor="title" className="label">Item name</label>
                <input id="title" name="title" required minLength={3} maxLength={120} placeholder="e.g. Silver house keys" className="input" />
              </div>

              <div>
                <label htmlFor="category" className="label">Category</label>
                <select id="category" name="category" required className="select">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description" className="label">Description</label>
                <textarea id="description" name="description" required minLength={10} maxLength={2000} rows={4} className="input" />
                <p className="mt-1 text-xs text-slate-500">At least 10 characters — include brand, color, and other details.</p>
              </div>

              <div>
                <label htmlFor="distinguishingFeatures" className="label">
                  Distinguishing features <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <textarea id="distinguishingFeatures" name="distinguishingFeatures" rows={2} className="input" />
              </div>
            </div>

          <div id="step-2" className={step === 2 ? "space-y-5" : "space-y-5 hidden"}>
              <div>
                <label htmlFor="dateFound" className="label">Date found</label>
                <input id="dateFound" name="dateFound" type="date" required className="input" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="label">City</label>
                  <input id="city" name="city" required className="input" />
                </div>
                <div>
                  <label htmlFor="province" className="label">Province</label>
                  <input id="province" name="province" required className="input" />
                </div>
              </div>

              <div>
                <label htmlFor="approximateLocation" className="label">
                  Approximate location <span className="font-normal text-slate-500">(optional — avoid exact addresses)</span>
                </label>
                <input id="approximateLocation" name="approximateLocation" placeholder="e.g. Near SM North EDSA" className="input" />
              </div>

              <div>
                <label htmlFor="currentHoldingInfo" className="label">
                  Where it&apos;s currently being kept <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <input id="currentHoldingInfo" name="currentHoldingInfo" placeholder="e.g. Kept at barangay hall" className="input" />
              </div>
            </div>

          <div id="step-3" className={step === 3 ? "space-y-5" : "space-y-5 hidden"}>
              <div>
                <label className="label">Photos <span className="font-normal text-slate-500">(at least 1 required)</span></label>
                <ImageUpload onChange={setImages} />
                {images.length > 0 && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <CheckCircle2 size={14} aria-hidden="true" />
                    {images.length} photo{images.length > 1 ? "s" : ""} ready — continue to review.
                  </p>
                )}
              </div>

              <p className="text-xs text-slate-500">
                Next, you&apos;ll review exactly what will be published before submitting.
              </p>
            </div>

          {/* Step 4 — Review everything before it goes live */}
          <div id="step-4" className={step === STEPS ? "space-y-5" : "space-y-5 hidden"}>
              {review && (
                <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white/80">
                  {[
                    ["Item", review.title],
                    ["Category", CATEGORY_LABELS[review.category as keyof typeof CATEGORY_LABELS] ?? review.category],
                    ["Description", review.description],
                    ["Date found", review.date],
                    ["Location", [review.city, review.province].filter(Boolean).join(", ")],
                    ...(review.approximateLocation
                      ? [["Approximate location", review.approximateLocation]]
                      : []),
                    ...(review.currentHoldingInfo
                      ? [["Currently kept", review.currentHoldingInfo]]
                      : []),
                    ["Photos", images.length === 0 ? "None yet" : `${images.length} photo${images.length > 1 ? "s" : ""}`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-3 px-4 py-3">
                      <dt className="w-40 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                      <dd className="whitespace-pre-wrap text-sm text-navy-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {/* Safety — what NOT to publish (existing Safety design language) */}
              <div role="note" className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-left">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                      Before you publish
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-700">
                      Keep identifying information off this public report. Never post:
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {[
                        "Full ID numbers or photos of government IDs",
                        "Your phone number, email, or social accounts",
                        "Exact home or private addresses",
                        "Wallet contents, card numbers, or bank details",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
                          <XCircle size={13} className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Ownership verification — preparation only, no fake verification */}
              <div role="note" className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-left">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                <p className="text-xs leading-relaxed text-slate-700">
                  <span className="font-semibold text-navy-900">
                    Prepare to verify ownership.
                  </span>{" "}
                  Keep one small detail about the item <span className="font-medium">off</span> this
                  report. When someone claims it, ask them to describe that detail privately
                  through FindBack messages before arranging a safe, public handover.
                </p>
              </div>

              <div role="note" className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-left">
                <Lock size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                <p className="text-xs leading-relaxed text-slate-700">
                  <span className="font-semibold text-navy-900">
                    Keep personal details off the public report.
                  </span>{" "}
                  Thank you for helping — after you submit, we&apos;ll surface any promising match
                  so you can arrange a safe return.
                </p>
              </div>
            </div>

          {/* Error — always visible regardless of step */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              {error}
              {authRequired && (
                <p className="mt-2">
                  <Link
                    href="/login?next=/report/found"
                    className="font-semibold underline underline-offset-2 hover:text-red-800"
                  >
                    Sign in and try again
                  </Link>
                </p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => goToStep(step - 1)}
              className={step === 1 ? "invisible btn-secondary" : "btn-secondary"}
            >
              Back
            </button>

            {step < STEPS ? (
              <button
                type="button"
                onClick={() => goToStep(step + 1)}
                className="btn-primary"
              >
                {step === 2 ? "Continue to photos" : step === 3 ? "Review report" : "Continue"}
              </button>
            ) : (
              <button type="submit" disabled={isPending} className="btn-primary">
                {isPending ? "Submitting…" : "Submit report"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
