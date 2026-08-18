"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { updateReportAction } from "@/lib/actions/my-reports";
import { uploadItemImagesAction } from "@/lib/actions/items";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";
import { ImageUpload } from "@/components/image-upload";
import { useToast } from "@/components/ui/toast";

export type EditableReport = {
  id: string;
  title: string;
  category: string;
  description: string;
  distinguishingFeatures: string | null;
  city: string;
  province: string;
  approximateLocation: string | null;
  dateString: string;
  reward: number | null;
  holdingInfo: string | null;
};

export function EditReportForm({ kind, item }: { kind: "lost_item" | "found_item"; item: EditableReport }) {
  const isLost = kind === "lost_item";
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("kind", kind);
    formData.set("id", item.id);
    startTransition(async () => {
      const result = await updateReportAction(formData);
      if (result?.error) {
        setError(result.error);
        toast("error", result.error);
        return;
      }

      if (newFiles.length > 0) {
        const uploadResult = await uploadItemImagesAction(kind, item.id, newFiles);
        if (uploadResult?.error) {
          toast("error", uploadResult.error);
          return;
        }
      }

      toast("success", "Report updated");
      router.push(`/search/${item.id}`);
    });
  }

  return (
    <form action={handleSubmit} className="card p-6 sm:p-8">
      <div>
        <label htmlFor="title" className="label">Item name</label>
        <input id="title" name="title" type="text" required minLength={3} maxLength={120} className="input" defaultValue={item.title} />
      </div>

      <div className="mt-5">
        <label htmlFor="category" className="label">Category</label>
        <select id="category" name="category" required className="input" defaultValue={item.category}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <label htmlFor="description" className="label">Description</label>
        <textarea id="description" name="description" required minLength={10} maxLength={2000} rows={5} className="input resize-y" defaultValue={item.description} />
      </div>

      <div className="mt-5">
        <label htmlFor="distinguishingFeatures" className="label">Distinguishing features (optional)</label>
        <textarea id="distinguishingFeatures" name="distinguishingFeatures" maxLength={1000} rows={3} className="input resize-y" defaultValue={item.distinguishingFeatures ?? ""} />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={isLost ? "dateLost" : "dateFound"} className="label">
            {isLost ? "Date lost" : "Date found"}
          </label>
          <input id={isLost ? "dateLost" : "dateFound"} name={isLost ? "dateLost" : "dateFound"} type="date" required className="input" defaultValue={item.dateString} />
        </div>
        <div>
          <label htmlFor="city" className="label">City</label>
          <input id="city" name="city" type="text" required className="input" defaultValue={item.city} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="province" className="label">Province</label>
          <input id="province" name="province" type="text" required className="input" defaultValue={item.province} />
        </div>
        <div>
          <label htmlFor="approximateLocation" className="label">Approximate location (optional)</label>
          <input id="approximateLocation" name="approximateLocation" type="text" maxLength={200} className="input" defaultValue={item.approximateLocation ?? ""} placeholder="e.g. Near SM North EDSA" />
        </div>
      </div>

      {isLost ? (
        <div className="mt-5">
          <label htmlFor="rewardAmount" className="label">Reward amount (PHP, optional)</label>
          <input id="rewardAmount" name="rewardAmount" type="number" min={0} step={1} className="input" defaultValue={item.reward ?? ""} />
        </div>
      ) : (
        <div className="mt-5">
          <label htmlFor="currentHoldingInfo" className="label">Where it&apos;s being held (optional)</label>
          <input id="currentHoldingInfo" name="currentHoldingInfo" type="text" maxLength={500} className="input" defaultValue={item.holdingInfo ?? ""} />
        </div>
      )}

      <div className="mt-5">
        <label className="label">Add more photos (optional)</label>
        <ImageUpload onChange={setNewFiles} />
      </div>

      {error && <p className="field-error mt-5" role="alert">{error}</p>}

      <div className="mt-7 flex items-center gap-3">
        <button type="submit" disabled={isPending} className="btn-primary">
          <Save size={16} aria-hidden="true" />
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}