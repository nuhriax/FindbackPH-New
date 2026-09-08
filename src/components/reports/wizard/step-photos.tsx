"use client";

// ---------------------------------------------------------------------------
// StepPhotos — the report wizard's Step 3.
//
// Enhanced with drag-and-drop zone, better photo preview, cover photo
// selector with visual badge, and improved tip card.
// ---------------------------------------------------------------------------

import { useState } from "react";
import { Camera, CheckCircle2, Lightbulb, Upload, X } from "lucide-react";
import type { WizardKind } from "../report-wizard-config";
import { WizardStepShell } from "./wizard-step-shell";

export function StepPhotos({
  kind,
  accent,
  isActive,
  images,
  setImages,
  coverIndex,
  setCoverIndex,
}: {
  kind: WizardKind;
  accent: import("../report-wizard-config").AccentPalette;
  isActive: boolean;
  images: File[];
  setImages: (files: File[]) => void;
  coverIndex: number;
  setCoverIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
  const maxPhotos = 4;
  const maxFileSize = 5 * 1024 * 1024;
  const photosLabel =
    kind === "lost" ? "Photos (optional)" : "Photos (strongly recommended)";
  const [dragActive, setDragActive] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const addFiles = (incoming: File[]) => {
    if (incoming.some((file) => !file.type.startsWith("image/"))) return setPhotoError("Only image files can be added.");
    if (incoming.some((file) => file.size > maxFileSize)) return setPhotoError("Each photo must be 5 MB or smaller.");
    const available = maxPhotos - images.length;
    if (available <= 0) return setPhotoError(`You can add up to ${maxPhotos} photos.`);
    setImages([...images, ...incoming.slice(0, available)]);
    setPhotoError(incoming.length > available ? `Only ${available} more photo${available === 1 ? "" : "s"} could be added.` : null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <WizardStepShell
      stepNumber={3}
      totalSteps={4}
      icon={Camera}
      heading={
        kind === "lost" ? "Add photos if you have them" : "Help the owner recognize it"
      }
      support={
        kind === "lost"
          ? "A photo can help people recognize your item, but you can continue without one."
          : "A clear photo makes it easier for the owner to recognize their item."
      }
      accent={accent}
      isActive={isActive}
    >
      <div>
        <label className="label flex items-center gap-1.5">
          {photosLabel}
        </label>

        {/* Drag and drop zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={[
            "relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300",
            dragActive
              ? "border-teal-400 bg-teal-50/50 scale-[1.02]"
              : "border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50",
          ].join(" ")}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                addFiles(Array.from(e.target.files));
                e.target.value = "";
              }
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
            id="photo-upload"
          />
          <label htmlFor="photo-upload" className="cursor-pointer">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200">
              <Upload size={20} className="text-slate-600" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-navy-900">
              Drop photos here or click to browse
            </p>
            <p className="mt-1 text-xs text-slate-500">
              JPG, PNG, WebP, or GIF · up to 4 photos, 5 MB each
            </p>
          </label>
        </div>

        {/* Photo preview grid */}
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={[
                  "group relative aspect-square rounded-xl border-2 overflow-hidden transition-all duration-200",
                  idx === coverIndex
                    ? "border-teal-500 ring-2 ring-teal-500/20 shadow-md"
                    : "border-slate-200 hover:border-slate-300",
                ].join(" ")}
              >
                <img
                  src={URL.createObjectURL(img)}
                  alt={`Photo ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
                {/* Cover badge */}
                {idx === coverIndex && (
                  <div className="absolute top-1.5 left-1.5 rounded-md bg-teal-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    Cover
                  </div>
                )}
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => {
                    setImages(images.filter((_, i) => i !== idx));
                    setCoverIndex((ci) => Math.max(0, Math.min(ci, images.length - 2)));
                  }}
                  className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-red-700"
                  aria-label={`Remove photo ${idx + 1}`}
                >
                  <X size={12} aria-hidden="true" />
                </button>
                {/* Click to set as cover */}
                {idx !== coverIndex && (
                  <button
                    type="button"
                    onClick={() => setCoverIndex(idx)}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/20 group-hover:opacity-100"
                    aria-label={`Set photo ${idx + 1} as cover`}
                  >
                    <span className="rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-navy-900 shadow-sm">
                      Set as cover
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {images.length > 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <CheckCircle2 size={14} aria-hidden={true} />
            {images.length} photo{images.length > 1 ? "s" : ""} added — the
            first one becomes the cover.
          </p>
        )}
        {photoError && (
          <p role="alert" className="mt-3 text-xs font-medium text-red-600">{photoError}</p>
        )}
      </div>

      {kind === "found" && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          Before uploading, hide ID or card numbers, QR codes, signatures, keys, and other details that could enable a false claim.
        </p>
      )}

      {/* Pro tip */}
      <div className="report-photo-tip flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 border border-amber-200">
          <Lightbulb
            size={16}
            className="report-photo-tip-icon text-amber-600"
            aria-hidden={true}
          />
        </div>
        <div className="text-xs leading-relaxed text-slate-700">
          <p className="font-semibold text-navy-900">
            {kind === "lost"
              ? "Photos help, but you can add them later."
              : "Photos dramatically increase the chance of a return."}
          </p>
          <p className="mt-1">
            {kind === "lost"
              ? "You can continue without a photo and add one later from your dashboard."
              : "Reports with at least one photo are recognized and claimed far more often."}
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Next, you&apos;ll review exactly what will be published before
        submitting.
      </p>
    </WizardStepShell>
  );
}
