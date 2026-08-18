"use client";

import { useState, useTransition } from "react";
import { createLostItemAction } from "@/lib/actions/items";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";
import { ImageUpload } from "@/components/image-upload";

export default function ReportLostPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<File[]>([]);

  async function handleSubmit(formData: FormData) {
    // Attach selected images to the form data
    images.forEach((file) => formData.append("images", file));
    setError(null);
    startTransition(async () => {
      const result = await createLostItemAction(formData);
      if (result?.error) setError(result.error);
    });
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

        {/* Progress hint */}
        <div className="mt-8 flex items-center gap-2">
          <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
          <div className="h-1 flex-1 rounded-full bg-blue-100" />
          <div className="h-1 flex-1 rounded-full bg-blue-100" />
        </div>
        <p className="mt-2 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
          Step 1 of 3 — Tell us about the item
        </p>

        <form action={handleSubmit} className="card mt-6 space-y-5 p-6 sm:p-8">
          <div>
            <label htmlFor="title" className="label">Item name</label>
            <input id="title" name="title" required placeholder="e.g. Black iPhone 15 Pro" className="input" />
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

        <div>
          <label className="label">Photos</label>
          <ImageUpload onChange={setImages} />
        </div>

        {error && <p className="field-error" role="alert">{error}</p>}

        <button type="submit" disabled={isPending} className="btn-primary w-full">
          {isPending ? "Submitting…" : "Submit report"}
        </button>
      </form>
      </div>
    </div>
  );
}
