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
    <div className="grid gap-4 lg:grid-cols-5 lg:items-start">
      {/* LEFT (3/5): the public report summary */}
      <section
        aria-labelledby="review-public"
        className="report-review-card rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition-all duration-300 hover:shadow-md lg:col-span-3"
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-slate-600" aria-hidden="true" />
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

        <dl className="divide-y divide-slate-100">
          {rows.map(({ label, value, editStep, icon }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
            >
              <span aria-hidden="true" className="w-5 shrink-0 text-center text-sm">
                {icon}
              </span>
              <dt className="w-32 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:w-40">
                {label}
              </dt>
              <dd className="min-w-0 flex-1 truncate text-sm text-navy-900" title={typeof value === "string" ? value : undefined}>
                {value}
              </dd>
              <button
                type="button"
                onClick={() => onEdit(editStep)}
                className={[
                  "shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium transition-all duration-200",
                  "hover:scale-105 active:scale-95",
                  accent.edit,
                ].join(" ")}
                aria-label={`Edit ${label.toLowerCase()}`}
              >
                Edit
              </button>
            </div>
          ))}
        </dl>
      </section>

      {/* RIGHT (2/5): quality, privacy notes, and confirmation */}
      <div className="space-y-3 lg:col-span-2">
        <section
          className="rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-3"
          aria-label="Report quality"
        >
          <p className="text-xs font-semibold text-teal-900">
            Report quality:{" "}
            {qualityGaps.length === 0
              ? "Great"
              : qualityGaps.length === 1
                ? "Good"
                : "Could be stronger"}
          </p>
          {qualityGaps.length > 0 ? (
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] leading-4 text-teal-800">
              {qualityGaps.map((gap) => (
                <li key={gap}>{gap}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-0.5 text-[11px] text-teal-800">
              All key details are included for matching and safe returns.
            </p>
          )}
        </section>

        {/* Private verification detail — compact single-row note */}
        <section
          aria-labelledby="review-private"
          className="flex items-center gap-3 rounded-xl border border-electric-200 bg-electric-50/60 px-4 py-2.5"
        >
          <Lock size={15} className="shrink-0 text-electric-700" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h3 id="review-private" className="text-xs font-bold text-navy-900">
              Private verification detail
              <span className="ml-1.5 rounded-full bg-electric-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-electric-700">
                Private
              </span>
            </h3>
            <p className="truncate text-xs text-slate-600">
              Hidden from the public — used to verify claimants.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onEdit(1)}
            className={[
              "shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all duration-200",
              "hover:scale-105 active:scale-95",
              accent.edit,
            ].join(" ")}
            aria-label="Edit private verification detail"
          >
            Edit
          </button>
        </section>

        {/* Privacy check — compact note */}
        <p
          role="note"
          className="report-privacy-check flex items-start gap-2 rounded-xl border border-sunrise-200 bg-sunrise-50/60 px-4 py-2.5 text-xs leading-5 text-sunrise-800"
        >
          <ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            Before publishing, double-check that no phone numbers, home
            addresses, or other sensitive info are in the description or photos.
          </span>
        </p>

        {/* Found-specific: ownership verification tip */}
        {cfg.extraField === "holding" && (
          <p
            role="note"
            className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-2.5 text-xs leading-5 text-emerald-800"
          >
            <ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              When someone claims it, ask them to describe the private detail via
              FindBack messages before arranging a safe, public handover.
            </span>
          </p>
        )}

        {/* Final confirmation */}
        <div className="report-confirm-card flex items-start gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4 transition-all duration-300 hover:border-slate-300 hover:shadow-md">
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
            <span className="font-semibold text-navy-900">I confirm</span> that
            the information in this report is accurate and safe to share.
          </label>
        </div>
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
