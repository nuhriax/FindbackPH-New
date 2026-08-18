"use client";

import { useState, useTransition } from "react";
import { createFoundItemAction } from "@/lib/actions/items";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";
import { ImageUpload } from "@/components/image-upload";

export default function ReportFoundPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<File[]>([]);

  async function handleSubmit(formData: FormData) {
    images.forEach((file) => formData.append("images", file));
    setError(null);
    startTransition(async () => {
      const result = await createFoundItemAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <span className="eyebrow">Found something?</span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
          Report a found item
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
          Thank you for helping return this item to its owner.
        </p>
      </div>

      <form action={handleSubmit} className="card mt-8 space-y-5 p-6 sm:p-8">
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
  );
}
