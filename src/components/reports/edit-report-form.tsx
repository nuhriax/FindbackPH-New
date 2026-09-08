"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, ChevronDown, Lock, MapIcon, MapPin, Save, Tag, X } from "lucide-react";
import { updateReportAction } from "@/lib/actions/my-reports";
import { uploadItemImagesClient } from "@/lib/file-upload-client";
import { removeItemImageAction } from "@/lib/actions/items";
import { COLORS, COLOR_LABELS, ColorValue } from "@/lib/validation";
import { PH_PROVINCES, PH_CITIES_BY_PROVINCE } from "@/lib/ph-addresses";
import { ImageUpload } from "@/components/image-upload";
import { CategoryDropdown } from "@/components/reports/category-dropdown";
import { ColorDropdown } from "@/components/reports/color-dropdown";
import { useToast } from "@/components/ui/toast";

export type EditPhoto = { id: string; url: string };

export type EditableReport = {
  id: string;
  title: string;
  category: string;
  color: string | null;
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
  // Selected category — drives the CategoryDropdown's icon and label.
  const [categoryVal, setCategoryVal] = useState(item.category);
  // Optional primary color (fixed palette) — powers the "Color matched" signal.
  const [colorVal, setColorVal] = useState<ColorValue | "">(
    (item.color as ColorValue) ?? ""
  );
  // Location dropdown state — mirrors the report wizard's province → city flow.
  const [provinceVal, setProvinceVal] = useState(item.province);
  const [cityVal, setCityVal] = useState(item.city);
  // Live description length for the character counter (matches the wizard).
  const [descLen, setDescLen] = useState(item.description.length);
  const router = useRouter();
  const { toast } = useToast();

  // Same dropdown data as the report wizard — keep the report's current values
  // selectable even if the reference data doesn't list them (e.g. old data).
  const provinceOptions =
    provinceVal && !PH_PROVINCES.includes(provinceVal)
      ? [...PH_PROVINCES, provinceVal]
      : PH_PROVINCES;
  const cityOptionsRaw = PH_CITIES_BY_PROVINCE[provinceVal] ?? [];
  const cityOptions =
    cityVal && !cityOptionsRaw.includes(cityVal)
      ? [...cityOptionsRaw, cityVal]
      : cityOptionsRaw;

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
      {/* ── SECTION 1 · Item details — same header as the report wizard ── */}
      <div>
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Tag size={18} aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display text-base font-bold text-navy-900">Item details</h3>
            <p className="text-xs text-slate-500">Tell people exactly what to look for.</p>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-navy-900">Item name</label>
            <input id="title" name="title" type="text" required minLength={3} maxLength={120} className="input" defaultValue={item.title} placeholder="e.g. Black wallet, blue backpack, keys" />
            <p className="mt-1 text-xs text-slate-500">Be specific enough to help people recognize it.</p>
          </div>

          <div>
            <label htmlFor="category" className="mb-1.5 block text-sm font-semibold text-navy-900">Category</label>
            <div>
              <CategoryDropdown value={categoryVal} onChange={setCategoryVal} />
              {/* Real form field that carries the selection in FormData.
                  Visually hidden and read-only — the dropdown above is the
                  interactive control. */}
              <input
                id="category"
                name="category"
                type="text"
                readOnly
                tabIndex={-1}
                aria-hidden="true"
                value={categoryVal}
                className="sr-only"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-navy-900">
              Primary color <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input type="hidden" name="color" value={colorVal} />
            <ColorDropdown value={colorVal} onChange={setColorVal} />
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-navy-900">Description</label>
            <div className="relative">
              <textarea
                id="description"
                name="description"
                required
                minLength={10}
                maxLength={2000}
                rows={4}
                defaultValue={item.description}
                onChange={(e) => setDescLen(e.target.value.length)}
                className="input resize-y"
              />
              <span className="pointer-events-none absolute bottom-3 right-4 text-xs tabular-nums text-slate-400">
                {descLen}/500
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">At least 10 characters — brand, color, and the general area help matching. Keep one-of-a-kind details for the private field below.</p>
          </div>

          <div>
            <label htmlFor="distinguishingFeatures" className="mb-1.5 block text-sm font-semibold text-navy-900">
              Private identifying details <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-teal-600/80" aria-hidden="true" />
              <textarea
                id="distinguishingFeatures"
                name="distinguishingFeatures"
                maxLength={1000}
                rows={2}
                defaultValue={item.distinguishingFeatures ?? ""}
                placeholder="e.g. Small crack beside the rear camera, blue case with a scratch on the bottom-right"
                className="input resize-y pl-11"
              />
            </div>
            <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500">
              <Lock size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
              Hidden from the public listing — used to confirm a claimant really knows the item.
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 2 · Where & when — same header as the report wizard ── */}
      <div className="mt-8 border-t border-slate-100 pt-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <MapPin size={18} aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display text-base font-bold text-navy-900">Where &amp; when</h3>
            <p className="text-xs text-slate-500">Narrow the search area and timeframe.</p>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={isLost ? "dateLost" : "dateFound"} className="mb-1.5 block text-sm font-semibold text-navy-900">
                {isLost ? "Date lost" : "Date found"}
              </label>
              <div className="relative">
                <Calendar size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-teal-600/80" aria-hidden="true" />
                <input
                  id={isLost ? "dateLost" : "dateFound"}
                  name={isLost ? "dateLost" : "dateFound"}
                  type="date"
                  required
                  max={new Date().toISOString().split("T")[0]}
                  defaultValue={item.dateString}
                  className="input pl-11 [color-scheme:light]"
                />
              </div>
            </div>
            {isLost ? (
              <div>
                <label htmlFor="rewardAmount" className="mb-1.5 block text-sm font-semibold text-navy-900">
                  Reward <span className="font-normal text-slate-400">(₱ Optional)</span>
                </label>
                <input id="rewardAmount" name="rewardAmount" type="number" min={0} step={1} className="input" defaultValue={item.reward ?? ""} />
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-400">Quick pick:</span>
                  {["100", "300", "500", "1000"].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        const input = document.getElementById("rewardAmount") as HTMLInputElement | null;
                        if (input) input.value = amount;
                      }}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                    >
                      ₱{Number(amount).toLocaleString("en-PH")}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="currentHoldingInfo" className="mb-1.5 block text-sm font-semibold text-navy-900">Where it&apos;s being held (optional)</label>
                <input id="currentHoldingInfo" name="currentHoldingInfo" type="text" maxLength={500} className="input" defaultValue={item.holdingInfo ?? ""} />
              </div>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="mb-1.5 block text-sm font-semibold text-navy-900">City</label>
              <div className="relative">
                <MapPin size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-teal-600/80" aria-hidden="true" />
                <select
                  id="city"
                  name="city"
                  required
                  value={cityVal}
                  onChange={(e) => setCityVal(e.target.value)}
                  className="input appearance-none pl-11 pr-10"
                >
                  <option value="" disabled>
                    {provinceVal ? "Select city" : "Select province first"}
                  </option>
                  {cityOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              </div>
            </div>
            <div>
              <label htmlFor="province" className="mb-1.5 block text-sm font-semibold text-navy-900">Province</label>
              <div className="relative">
                <MapIcon size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-teal-600/80" aria-hidden="true" />
                <select
                  id="province"
                  name="province"
                  required
                  value={provinceVal}
                  onChange={(e) => {
                    const p = e.target.value;
                    setProvinceVal(p);
                    // Keep the city consistent with its province.
                    if (!PH_CITIES_BY_PROVINCE[p]?.includes(cityVal)) setCityVal("");
                  }}
                  className="input appearance-none pl-11 pr-10"
                >
                  <option value="" disabled>Select province</option>
                  {provinceOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="approximateLocation" className="mb-1.5 block text-sm font-semibold text-navy-900">
              Approximate location <span className="font-normal text-slate-400">(optional — avoid exact addresses)</span>
            </label>
            <div className="relative">
              <MapPin size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-teal-600/80" aria-hidden="true" />
              <input id="approximateLocation" name="approximateLocation" type="text" maxLength={200} className="input pl-11" defaultValue={item.approximateLocation ?? ""} placeholder="e.g. Near SM City Davao, front entrance" />
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3 · Photos ── */}
      <div className="mt-8 border-t border-slate-100 pt-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Save size={18} aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display text-base font-bold text-navy-900">Photos</h3>
            <p className="text-xs text-slate-500">Clear, well-lit photos help people match your item.</p>
          </div>
        </div>

        <div className="mt-5 space-y-5">

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
                <img loading="lazy"
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

          <div>
            <label className="label">Add more photos (optional)</label>
            <ImageUpload onChange={setNewFiles} />
          </div>
        </div>
      </div>

      {error && <p className="field-error mt-5" role="alert">{error}</p>}

      <div className="mt-7 flex items-center gap-3 border-t border-slate-100 pt-5">
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