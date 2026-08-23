"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import { updateReportAction } from "@/lib/actions/my-reports";
import { uploadItemImagesClient } from "@/lib/file-upload-client";
import { removeItemImageAction } from "@/lib/actions/items";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";
import { ImageUpload } from "@/components/image-upload";
import { useToast } from "@/components/ui/toast";

export type EditPhoto = { id: string; url: string };

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

export function EditReportForm({
  kind,
  item,
  images = [],
  onSaved,
  onCancel,
}: {
  kind: "lost_item" | "found_item";
  item: EditableReport;
  /** Photos currently stored on the report — removable inline. */
  images?: EditPhoto[];
  /** When provided (inline editing), saving stays on the current page. */
  onSaved?: () => void;
  /** When provided (inline editing), Cancel collapses instead of navigating. */
  onCancel?: () => void;
}) {
  const isLost = kind === "lost_item";
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<EditPhoto[]>(images);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  async function handleRemoveImage(imageId: string) {
    // Keep at least one photo on the report (creation requires one too).
    if (existingImages.length <= 1 && newFiles.length === 0) {
      toast(
        "error",
        "A report needs at least one photo — add a new one before removing this."
      );
      return;
    }

    setRemovingId(imageId);
    let result: { error?: string } | undefined;
    try {
      result = await removeItemImageAction(imageId);
    } catch {
      result = { error: "Couldn't remove that photo. Please try again." };
    }
    setRemovingId(null);

    if (result?.error) {
      toast("error", result.error);
      return;
    }

    setExistingImages((prev) => prev.filter((p) => p.id !== imageId));
    toast("success", "Photo removed");
    router.refresh();
  }


  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("kind", kind);
    formData.set("id", item.id);
    startTransition(async () => {
      let result: { error?: string } | undefined;
      try {
        result = await updateReportAction(formData);
      } catch {
        // A network/server hiccup would otherwise hang the button forever.
        const msg = "We couldn't save your changes. Please try again.";
        setError(msg);
        toast("error", msg);
        return;
      }

      if (result?.error) {
        setError(result.error);
        toast("error", result.error);
        return;
      }

      if (newFiles.length > 0) {
        const uploadErr = await uploadItemImagesClient(kind, item.id, newFiles);
        if (uploadErr) {
          toast("error", uploadErr);
          return;
        }
      }

      toast("success", "Report updated");
      router.refresh();

      if (onSaved) {
        // Inline editing — stay exactly where we are, just collapse the form.
        onSaved();
        return;
      }

      // Standalone edit page — return to the dashboard report list.
      router.push("/dashboard/reports");
      // Safety net: if the client-side transition is ever interrupted, fall
      // back to a full page load so the user ALWAYS ends up on their reports.
      window.setTimeout(() => {
        if (!window.location.pathname.startsWith("/dashboard/reports")) {
          window.location.assign("/dashboard/reports");
        }
      }, 1200);
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

      {existingImages.length > 0 && (
        <div className="mt-5">
          <label className="label">Current photos</label>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {existingImages.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt="Current report photo"
                  className={`h-full w-full object-cover transition-opacity ${
                    removingId === img.id ? "opacity-40" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(img.id)}
                  disabled={removingId !== null}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition-opacity hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={12} />
                </button>
                {removingId === img.id && (
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[10px] font-medium text-white">
                    Removing…
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Click ✕ on a photo to remove it. You can also add new ones below.
          </p>
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
        <button
          type="button"
          onClick={() =>
            onCancel ? onCancel() : router.push("/dashboard/reports")
          }
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}