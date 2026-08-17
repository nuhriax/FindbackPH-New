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
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Report a found item</h1>
      <p className="mt-1 text-sm text-slate-400">
        Thank you for helping return this item to its owner.
      </p>

      <form action={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm text-slate-300">Item name</label>
          <input id="title" name="title" required placeholder="e.g. Silver house keys" className="input" />
        </div>

        <div>
          <label htmlFor="category" className="mb-1 block text-sm text-slate-300">Category</label>
          <select id="category" name="category" required className="input">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm text-slate-300">Description</label>
          <textarea id="description" name="description" required rows={4} className="input" />
        </div>

        <div>
          <label htmlFor="distinguishingFeatures" className="mb-1 block text-sm text-slate-300">
            Distinguishing features <span className="text-slate-500">(optional)</span>
          </label>
          <textarea id="distinguishingFeatures" name="distinguishingFeatures" rows={2} className="input" />
        </div>

        <div>
          <label htmlFor="dateFound" className="mb-1 block text-sm text-slate-300">Date found</label>
          <input id="dateFound" name="dateFound" type="date" required className="input" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="city" className="mb-1 block text-sm text-slate-300">City</label>
            <input id="city" name="city" required className="input" />
          </div>
          <div>
            <label htmlFor="province" className="mb-1 block text-sm text-slate-300">Province</label>
            <input id="province" name="province" required className="input" />
          </div>
        </div>

        <div>
          <label htmlFor="approximateLocation" className="mb-1 block text-sm text-slate-300">
            Approximate location <span className="text-slate-500">(optional — avoid exact addresses)</span>
          </label>
          <input id="approximateLocation" name="approximateLocation" placeholder="e.g. Near SM North EDSA" className="input" />
        </div>

        <div>
          <label htmlFor="currentHoldingInfo" className="mb-1 block text-sm text-slate-300">
            Where it&apos;s currently being kept <span className="text-slate-500">(optional)</span>
          </label>
          <input id="currentHoldingInfo" name="currentHoldingInfo" placeholder="e.g. Kept at barangay hall" className="input" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">Photos</label>
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
