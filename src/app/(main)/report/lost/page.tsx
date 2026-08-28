"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { createLostItemAction } from "@/lib/actions/items";
import { uploadItemImagesClient } from "@/lib/file-upload-client";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";
import { ImageUpload } from "@/components/image-upload";
import { MotionReveal } from "@/components/effects/motion-reveal";
import { PhilippinesMap } from "@/components/map/philippines-map";
import { ReportStepsIndicator } from "@/components/report-steps-indicator";

const STEPS = 4;

type ReviewSnapshot = {
  title: string;
  category: string;
  description: string;
  date: string;
  city: string;
  province: string;
  approximateLocation: string;
  pinned: string;
};

export default function ReportLostPage() {
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
  // Optional "Pin exact location" coordinate captured on the Where & when
  // step. Kept in state (instead of relying only on the hidden inputs) so the
  // marker and the coordinate readout can render live.
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);

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
                : "Please describe your item (spaces don't count)."
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
        "lost-report-form"
      ) as HTMLFormElement | null;
      if (form) {
        const fd = new FormData(form);
        const latStr = fd.get("latitude")?.toString() ?? "";
        const lngStr = fd.get("longitude")?.toString() ?? "";
        setReview({
          title: fd.get("title")?.toString() ?? "",
          category: fd.get("category")?.toString() ?? "",
          description: fd.get("description")?.toString() ?? "",
          date: fd.get("dateLost")?.toString() ?? "",
          city: fd.get("city")?.toString() ?? "",
          province: fd.get("province")?.toString() ?? "",
          approximateLocation: fd.get("approximateLocation")?.toString() ?? "",
          pinned:
            latStr && lngStr
              ? `${Number(latStr).toFixed(6)}, ${Number(lngStr).toFixed(6)}`
              : "",
        });
      }
    }
    setStep(Math.min(STEPS, Math.max(1, next)));
  }

  async function handleSubmit(formData: FormData) {
    if (step !== STEPS) return;

    const form = document.getElementById(
      "lost-report-form"
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
      setError("Please describe your item in at least 10 characters (spaces don't count).");
      setStep(1);
      return;
    }
    if (images.length === 0) {
      setError("Please add at least one photo before submitting.");
      return;
    }
    // Selected photos are uploaded separately through the route handler —
    // Server Actions can't accept File objects (Next.js only serializes
    // JSON-like values), so we never put them into `formData`.
    setError(null);
    startTransition(async () => {
      const result = await createLostItemAction(formData);
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
        "lost_item",
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
              Your lost report is{" "}
              <span className="bg-gradient-to-r from-blue-600 via-electric-500 to-violet-500 bg-clip-text text-transparent">
                live!
              </span>
            </h1>
          </MotionReveal>

          <MotionReveal delay={150}>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
              Nice work — we&apos;ve started matching it against found items
              right away. When something promising turns up, we&apos;ll notify
              you instantly.
            </p>
          </MotionReveal>

          <MotionReveal delay={220}>
            <ol className="mx-auto mt-9 flex max-w-md flex-col gap-3 text-left">
              {[
                ["We search", "We compare it with active found reports in your area."],
                ["We notify you", "A notification appears the moment a possible match is found."],
                ["You reunite", "Confirm ownership, arrange a safe handover, and mark it home."],
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
              <Link href={`/lost/${confirmedId}`} className="btn-primary">
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
            <p className="mt-5 text-xs text-slate-500">
              Tip: share your report link on social media — it doubles the
              chance of a match.
            </p>
          </MotionReveal>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="text-center">
          <span className="eyebrow">Lost something?</span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
            Report a lost item
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            Add as much detail as you can — it helps us find a match faster.
            Only share the item&apos;s details publicly; keep personal info private.
          </p>
        </div>

        {/* Progress steps */}
        <ReportStepsIndicator
          current={step}
          accent="teal"
          caption={
            step === 1
              ? "Step 1 · Item details"
              : step === 2
                ? "Step 2 · Where & when"
                : step === 3
                  ? "Step 3 · Photos"
                  : "Step 4 · Review & submit"
          }
        />

        <form
          id="lost-report-form"
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
                <input id="title" name="title" required minLength={3} maxLength={120} placeholder="e.g. Black iPhone 15 Pro" className="input" />
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dateLost" className="label">Date lost</label>
                  <input id="dateLost" name="dateLost" type="date" required className="input" />
                </div>
                <div>
                  <label htmlFor="rewardAmount" className="label">
                    Reward, ₱ <span className="font-normal text-slate-500">(optional)</span>
                  </label>
                  <input id="rewardAmount" name="rewardAmount" type="number" min={0} className="input" />
                </div>
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

              {/* Pin exact location — Philippines-only map picker (optional). */}
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="label">
                    Pin exact location <span className="font-normal text-slate-500">(optional — helps proximity matching)</span>
                  </label>
                  {pin && (
                    <button
                      type="button"
                      onClick={() => setPin(null)}
                      className="text-xs font-semibold text-red-600 transition hover:text-red-700"
                    >
                      Clear pin
                    </button>
                  )}
                </div>

                <div className="relative -mx-6 h-72 overflow-hidden border-y border-slate-200 bg-slate-100 sm:-mx-8 sm:h-80 lg:h-[26rem]">
                  {step === 2 ? (
                    <PhilippinesMap
                      mode="pick"
                      latitude={pin?.lat ?? null}
                      longitude={pin?.lng ?? null}
                      onPick={(lat, lng) => setPin({ lat, lng })}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs text-slate-400">
                      Map available on this step
                    </div>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                  <p className="text-slate-500">
                    {pin
                      ? "Drag the pin or click the map to adjust."
                      : "Click anywhere on the map to drop a pin."}
                  </p>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
                    {pin ? `${pin.lat.toFixed(6)}, ${pin.lng.toFixed(6)}` : "no pin set"}
                  </span>
                </div>

                {/* The pin travels with the form's FormData via hidden inputs. */}
                <input type="hidden" name="latitude" value={pin ? String(pin.lat) : ""} />
                <input type="hidden" name="longitude" value={pin ? String(pin.lng) : ""} />
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
                    ["Date lost", review.date],
                    ["Location", [review.city, review.province].filter(Boolean).join(", ")],
                    ...(review.approximateLocation
                      ? [["Approximate location", review.approximateLocation]]
                      : []),
                    ...(review.pinned
                      ? [["Pinned location", review.pinned]]
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

              <div role="note" className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-left">
                <Lock size={16} className="mt-0.5 shrink-0 text-blue-600" />
                <p className="text-xs leading-relaxed text-slate-700">
                  <span className="font-semibold text-navy-900">
                    Keep personal details off the public report.
                  </span>{" "}
                  Share only the item&apos;s details. After you submit, we&apos;ll start matching and
                  surface any promising lead right on your report.
                </p>
              </div>

              <div role="note" className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-left">
                <p className="text-xs font-semibold text-navy-900">
                  Never include in your report or photos:
                </p>
                <ul className="mt-2 space-y-1.5">
                  {[
                    "Passwords, PINs, or unlock patterns",
                    "Full ID numbers or photos of government IDs",
                    "Your phone number, email, or social accounts",
                    "Exact home or private addresses",
                    "Card numbers, bank details, or wallet contents",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
                      <Lock size={13} className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
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
                    href="/login?next=/report/lost"
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
