"use client";

// ---------------------------------------------------------------------------
// WizardReviewList — the public/private/privacy check breakdown shown on
// the Review step. Enhanced with better visual hierarchy and card-based layout.
// ---------------------------------------------------------------------------

import { Check, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { CATEGORY_LABELS, COLOR_LABELS, COLORS } from "@/lib/validation";
import type { ColorValue } from "@/lib/validation";
import type { AccentPalette, ReviewSnapshot, WizardConfig } from "../report-wizard-config";

export type ReviewEditStep = 1 | 2 | 3 | 4;

export function WizardReviewList({
  cfg,
  review,
  imageCount,
  onEdit,
  accent,
}: {
  cfg: WizardConfig;
  review: ReviewSnapshot;
  imageCount: number;
  onEdit: (step: ReviewEditStep) => void;
  accent: AccentPalette;
}) {
  const qualityGaps = [
    imageCount === 0 && "Add a clear photo to help people recognize the item.",
    !review.timeWindow && "Add an approximate time if you remember one.",
    !review.color && "Choose a primary color to improve matching.",
    !review.hasPrivateDetail && "Keep one private detail for safe ownership checks.",
  ].filter(Boolean) as string[];
  const rows: { label: string; value: React.ReactNode; editStep: ReviewEditStep; icon?: React.ReactNode }[] = [
    {
      label: "Item",
      value: review.title,
      editStep: 1,
      icon: <span className="text-lg">📦</span>,
    },
    {
      label: "Category",
      value:
        CATEGORY_LABELS[review.category as keyof typeof CATEGORY_LABELS] ?? review.category,
      editStep: 1,
      icon: <span className="text-lg">🏷️</span>,
    },
    {
      label: "Primary color",
      value: review.color ? (
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block h-5 w-5 rounded-full border-2 border-slate-300 shadow-sm"
            style={{ backgroundColor: COLORS.find((c) => c.value === review.color)?.hex }}
            aria-hidden="true"
          />
          {COLOR_LABELS[review.color as ColorValue] ?? review.color}
        </span>
      ) : (
        <span className="text-slate-400">—</span>
      ),
      editStep: 1,
      icon: <span className="text-lg">🎨</span>,
    },
    {
      label: "Description",
      value: review.description,
      editStep: 1,
      icon: <span className="text-lg">📝</span>,
    },
    {
      label: cfg.dateLabel,
      value: review.date,
      editStep: 2,
      icon: <span className="text-lg">📅</span>,
    },
    {
      label: "Approximate time",
      value: review.timeWindow || <span className="text-slate-400">—</span>,
      editStep: 2,
    },
    {
      label: "Location",
      value: [review.city, review.province].filter(Boolean).join(", "),
      editStep: 2,
      icon: <span className="text-lg">📍</span>,
    },
    {
      label: "Approximate location",
      value: review.approximateLocation || <span className="text-slate-400">—</span>,
      editStep: 2,
      icon: <span className="text-lg">🗺️</span>,
    },
  ];
  if (cfg.extraField === "holding") {
    rows.push({
      label: "Currently kept",
      value: review.currentHoldingInfo || <span className="text-slate-400">—</span>,
      editStep: 2,
      icon: <span className="text-lg">📍</span>,
    });
  }
  rows.push({
    label: "Photos",
    value: imageCount === 0
      ? <span className="text-slate-400">No photos added</span>
      : `${imageCount} photo${imageCount > 1 ? "s" : ""} (first is cover)`,
    editStep: 3,
    icon: <span className="text-lg">📸</span>,
  });

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4" aria-label="Report quality">
        <p className="text-sm font-semibold text-teal-900">Report quality: {qualityGaps.length === 0 ? "Great" : qualityGaps.length === 1 ? "Good" : "Could be stronger"}</p>
        {qualityGaps.length > 0 ? <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-teal-800">{qualityGaps.map((gap) => <li key={gap}>{gap}</li>)}</ul> : <p className="mt-1 text-xs text-teal-800">You have included the key details that help matching and safe returns.</p>}
      </section>
      {/* Public information card */}
      <section
        aria-labelledby="review-public"
        className="report-review-card rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition-all duration-300 hover:shadow-md"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-slate-600" aria-hidden="true" />
            <h3
              id="review-public"
              className="report-eyebrow text-sm font-semibold text-slate-700"
            >
              Public information
            </h3>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            Visible to everyone
          </span>
        </div>

        <div className="space-y-3">
          {rows.map(({ label, value, editStep, icon }) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-all duration-200 hover:bg-slate-50 hover:border-slate-200"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-sm">
                {icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {label}
                </p>
                <p className="mt-0.5 text-sm text-navy-900 break-words">
                  {typeof value === 'string' ? value : value}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onEdit(editStep)}
                className={[
                  "shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200",
                  "hover:scale-105 active:scale-95",
                  accent.edit,
                ].join(" ")}
                aria-label={`Edit ${label.toLowerCase()}`}
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Private verification detail */}
      <section
        aria-labelledby="review-private"
        className="flex items-start gap-4 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-50/50 p-5 transition-all duration-300 hover:shadow-md"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 border border-blue-200">
          <Lock size={18} className="text-blue-700" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              id="review-private"
              className="text-sm font-bold text-navy-900"
            >
              Private verification detail
            </h3>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 border border-blue-200">
              Private
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            Hidden from the public listing — only you see it. Use it to confirm
            a claimant really knows the item.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onEdit(1)}
          className={[
            "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200",
            "hover:scale-105 active:scale-95",
            accent.edit,
          ].join(" ")}
          aria-label="Edit private verification detail"
        >
          Edit
        </button>
      </section>

      {/* Privacy check */}
      <div
        role="note"
        className="report-privacy-check rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-50/50 p-5 transition-all duration-300 hover:shadow-md"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 border border-amber-200">
            <Lock size={16} className="text-amber-700" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-navy-900 mb-1">
              Privacy check
            </p>
            <p className="text-xs leading-relaxed text-slate-600">
              Before publishing, make sure you haven&apos;t included phone numbers,
              home addresses, IDs, passwords, or other sensitive information in the
              public description or photos.
            </p>
          </div>
        </div>
      </div>

      {/* Found-specific: ownership verification tip */}
      {cfg.extraField === "holding" && (
        <div
          role="note"
          className="flex items-start gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-50/50 p-5 text-left transition-all duration-300 hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 border border-emerald-200">
            <ShieldCheck size={18} className="text-emerald-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-navy-900 mb-1">
              Prepare to verify ownership
            </p>
            <p className="text-xs leading-relaxed text-slate-600">
              When someone claims it, ask them to describe a detail you kept
              private through FindBack messages before arranging a safe, public
              handover.
            </p>
          </div>
        </div>
      )}

      {/* Final confirmation */}
      <div className="report-confirm-card flex items-start gap-4 rounded-2xl border-2 border-slate-200 bg-white p-5 transition-all duration-300 hover:border-slate-300 hover:shadow-md">
        <div className="relative mt-0.5">
          <input
            id="confirmAccurate"
            name="confirmAccurate"
            type="checkbox"
            required
            className="peer h-5 w-5 shrink-0 cursor-pointer rounded border-2 border-slate-300 text-teal-600 transition-all duration-200 focus:ring-4 focus:ring-teal-500/20 checked:border-teal-600"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity duration-200">
            <Check size={14} className="text-white" aria-hidden="true" />
          </div>
        </div>
        <label
          htmlFor="confirmAccurate"
          className="cursor-pointer text-sm leading-relaxed text-slate-700"
        >
          <span className="font-semibold text-navy-900">I confirm</span> that the
          information in this report is accurate and safe to share.
        </label>
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  onEdit: () => void;
  accent: AccentPalette;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <dt className="w-40 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd
        className={`min-w-0 flex-1 whitespace-pre-wrap text-sm ${
          value === "—" ? "text-slate-400" : "text-navy-900"
        }`}
      >
        {value}
      </dd>
      <button
        type="button"
        onClick={onEdit}
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold transition ${accent.edit}`}
        aria-label={`Edit ${label.toLowerCase()}`}
      >
        Edit
      </button>
    </div>
  );
}
