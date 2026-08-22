"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { createFoundItemAction } from "@/lib/actions/items";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";
import { ImageUpload } from "@/components/image-upload";

export default function ReportFoundPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<File[]>([]);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  async function handleSubmit(formData: FormData) {
    images.forEach((file) => formData.append("images", file));
    setError(null);
    startTransition(async () => {
      const result = await createFoundItemAction(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.itemId) {
        setConfirmedId(result.itemId);
      }
    });
  }

  if (confirmedId) {
    return (
      <div className="py-16 lg:py-24">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
            <CheckCircle2 size={26} />
          </div>

          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
            Report submitted — thank you!
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600">
            Your found report is live. When it&apos;s matched with a lost report,
            we&apos;ll help you take it from here — every handover brings something
            one step closer to home.
          </p>

          <ol className="mx-auto mt-7 flex max-w-md flex-col gap-3 text-left">
            {[
              ["It's visible", "Your report is now public to people searching the community."],
              ["We help it match", "If a lost report seems to match, we flag it as a possible match."],
              ["Safe return", "Confirm ownership details and arrange a safe, public handover."],
            ].map(([t, d], i) => (
              <li key={t} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white/70 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-semibold text-white">
                  {i + 1}
                </span>
                <div className="text-left">
                  <p className="text-sm font-medium text-navy-900">{t}</p>
                  <p className="text-xs leading-relaxed text-slate-500">{d}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
            <Link href={`/found/${confirmedId}`} className="btn-primary">
              View your report
            </Link>
            <button type="button" onClick={() => setConfirmedId(null)} className="btn-secondary">
              Report another
            </button>
          </div>
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
        </div>

        {/* Progress steps */}
        <div className="mt-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
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
              ? "Item details"
              : step === 2
                ? "Where & when"
                : "Photos & review"}
          </p>
        </div>

        <form action={handleSubmit} className="card mt-6 p-6 sm:p-8">
          <div className={step === 1 ? "space-y-5" : "space-y-5 hidden"}>
              <div>
                <label htmlFor="title" className="label">Item name</label>
                <input id="title" name="title" required placeholder="e.g. Silver house keys" className="input" />
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
                <textarea id="description" name="description" required rows={4} className="input" />
              </div>

              <div>
                <label htmlFor="distinguishingFeatures" className="label">
                  Distinguishing features <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <textarea id="distinguishingFeatures" name="distinguishingFeatures" rows={2} className="input" />
              </div>
            </div>

          <div className={step === 2 ? "space-y-5" : "space-y-5 hidden"}>
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

          <div className={step === 3 ? "space-y-5" : "space-y-5 hidden"}>
              <div>
                <label className="label">Photos</label>
                <ImageUpload onChange={setImages} />
              </div>

              {error && <p className="field-error" role="alert">{error}</p>}

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

          {/* Navigation */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className={step === 1 ? "invisible btn-secondary" : "btn-secondary"}
            >
              Back
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                className="btn-primary"
              >
                Continue
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
