"use client";

// ---------------------------------------------------------------------------
// StepItemDetails — the report wizard's Step 1.
//
// Enhanced with better visual grouping, larger color swatches, improved
// category selection UX, and better helper text.
// ---------------------------------------------------------------------------

import { Check, Lock, Tag, HelpCircle } from "lucide-react";
import type { ColorValue } from "@/lib/validation";
import { ColorDropdown } from "../color-dropdown";
import { CategoryDropdown } from "../category-dropdown";
import { TITLE_EXAMPLES } from "@/lib/category-examples";
import { SimilarReportsHint } from "../similar-reports-hint";
import { SensitiveCategoryHint } from "../sensitive-category-hint";
import type { AccentPalette, WizardConfig, WizardKind } from "../report-wizard-config";
import { WizardStepShell } from "./wizard-step-shell";

export function StepItemDetails({
  kind,
  cfg,
  isActive,
  categoryVal,
  setCategoryVal,
  color,
  setColor,
  descLen,
  setDescLen,
}: {
  kind: WizardKind;
  cfg: WizardConfig;
  isActive: boolean;
  categoryVal: string;
  setCategoryVal: (v: string) => void;
  color: ColorValue | "";
  setColor: (v: ColorValue | "") => void;
  descLen: number;
  setDescLen: (n: number) => void;
}) {
  return (
    <WizardStepShell
      stepNumber={1}
      totalSteps={4}
      icon={Tag}
      heading={cfg.stepHeadings[0]}
      support={cfg.stepSupport[0]}
      accent={cfg.accent}
      isActive={isActive}
    >
      {/* What is the item? - Public information */}
      <FieldGroup
        title="What is the item?"
        caption="This information will be visible to everyone searching."
      >
        <ItemNameField categoryVal={categoryVal} kind={kind} />
        <PrimaryColorPicker color={color} setColor={setColor} />
        <CategoryField
          categoryVal={categoryVal}
          setCategoryVal={setCategoryVal}
        />
        <DescriptionField descLen={descLen} setDescLen={setDescLen} />
      </FieldGroup>

      {/* Private verification detail - Always last */}
        <PrivateVerificationField
          distPlaceholder={cfg.distPlaceholder}
          required={kind === "found" && ["phones", "wallets", "ids", "documents", "jewelry", "electronics"].includes(categoryVal)}
        />
    </WizardStepShell>
  );
}

function FieldGroup({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="report-subcard space-y-5 rounded-2xl border border-slate-200/70 bg-white/70 p-4 sm:p-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="report-eyebrow text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {title}
          </p>
          {caption && (
            <p className="mt-1 text-xs text-slate-500">{caption}</p>
          )}
        </div>
        <HelpCircle size={16} className="text-slate-400" aria-hidden="true" />
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function ItemNameField({
  categoryVal,
  kind,
}: {
  categoryVal: string;
  kind: WizardKind;
}) {
  return (
    <div>
      <label htmlFor="title" className="label flex items-center gap-1.5">
        Item name <span className="font-normal text-slate-400">*</span>
      </label>
      <input
        id="title"
        name="title"
        required
        minLength={3}
        maxLength={120}
        placeholder={
          categoryVal
            ? TITLE_EXAMPLES[categoryVal as keyof typeof TITLE_EXAMPLES] ??
              "e.g. Black iPhone 15 Pro"
            : "e.g. Black wallet, brown backpack, house keys…"
        }
        className="input transition-all duration-200 focus:ring-4 focus:ring-teal-500/10"
      />
      <div className="mt-2">
        <SimilarReportsHint kind={kind} />
      </div>
    </div>
  );
}

function PrimaryColorPicker({
  color,
  setColor,
}: {
  color: ColorValue | "";
  setColor: (v: ColorValue | "") => void;
}) {
  return (
    <div>
      <p className="label flex items-center gap-1.5">
        Primary color <span className="font-normal text-slate-500">(optional)</span>
      </p>
      <p className="mb-3 text-xs text-slate-500">
        The single most useful visual identifier. Choose a color from the list; pick
        &ldquo;No color selected&rdquo; to clear.
      </p>
      <input type="hidden" name="color" value={color} />
      <ColorDropdown value={color} onChange={setColor} />
    </div>
  );
}

function CategoryField({
  categoryVal,
  setCategoryVal,
}: {
  categoryVal: string;
  setCategoryVal: (v: string) => void;
}) {
  return (
    <div>
      <p className="label flex items-center gap-1.5">
        Category <span className="font-normal text-slate-400">*</span>
      </p>
      {/* Real form field that carries the selection in FormData. Visually
          hidden — the CategoryDropdown above is the interactive control. */}
      <input type="hidden" name="category" value={categoryVal} />
      <CategoryDropdown value={categoryVal} onChange={setCategoryVal} />
      <SensitiveCategoryHint category={categoryVal} />
      {categoryVal && (
        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
          {categoryVal === "phones" && "Include brand, model, case color, and condition. Keep serial/IMEI numbers private."}
          {categoryVal === "wallets" && "Include color, material, and general contents. Never publish card or account numbers."}
          {categoryVal === "ids" || categoryVal === "documents" ? "State the document type and issuing organization. Never publish names, ID numbers, addresses, or signatures." : null}
          {categoryVal === "pets" && "Include species, breed, collar color, and temperament. Avoid publishing the exact home address."}
          {categoryVal === "keys" && "Describe the keyring or keychain, but do not show a home address or identifiable house number."}
          {["bags", "jewelry", "electronics", "clothing", "school_items", "other"].includes(categoryVal) && "Include brand, size, material, condition, and any visible non-sensitive features."}
        </p>
      )}
    </div>
  );
}

function DescriptionField({
  descLen,
  setDescLen,
}: {
  descLen: number;
  setDescLen: (n: number) => void;
}) {
  const maxLength = 500;
  const progress = Math.min((descLen / maxLength) * 100, 100);
  const isNearLimit = descLen > maxLength * 0.9;

  return (
    <div>
      <label htmlFor="description" className="label flex items-center gap-1.5">
        Description <span className="font-normal text-slate-400">*</span>
      </label>
      <textarea
        id="description"
        name="description"
        required
        minLength={10}
        maxLength={maxLength}
        rows={5}
        className="input transition-all duration-200 focus:ring-4 focus:ring-teal-500/10"
        onChange={(e) => setDescLen(e.target.value.length)}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Describe the brand, color, size, model, condition, or other visible features.
        </p>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isNearLimit ? "bg-amber-500" : "bg-teal-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span
            className={`shrink-0 font-mono text-[11px] tabular-nums transition-colors ${
              isNearLimit ? "text-amber-600 font-semibold" : "text-slate-400"
            }`}
            aria-live="polite"
          >
            {descLen} / {maxLength}
          </span>
        </div>
      </div>
    </div>
  );
}

function PrivateVerificationField({
  distPlaceholder,
  required,
}: {
  distPlaceholder: string;
  required: boolean;
}) {
  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-50/50 p-5 transition-all duration-300 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 border border-blue-200">
          <Lock size={20} className="text-blue-700" aria-hidden={true} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="flex items-center gap-2 text-sm font-bold text-navy-900">
            Private verification detail {required && <span className="text-red-600">*</span>}
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 border border-blue-200">
              Private
            </span>
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
            Keep one or two details hidden from the public. You can use them to
            confirm that someone claiming the item really knows it.
          </p>
          <label htmlFor="distinguishingFeatures" className="sr-only">
            Private verification detail
          </label>
          <textarea
            id="distinguishingFeatures"
            name="distinguishingFeatures"
            rows={3}
            maxLength={1000}
            required={required}
            className="input mt-3 border-blue-200 bg-white transition-all duration-200 focus:ring-4 focus:ring-blue-500/10"
            placeholder={distPlaceholder}
          />
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-blue-700">
            <Lock size={12} className="shrink-0" aria-hidden={true} />
            Hidden from the public listing
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {required
              ? "Required for found items: use a detail only the real owner would know. Don’t repeat it publicly."
              : "Use details that a genuine owner would know. Don’t repeat these details in the public description."}
          </p>
        </div>
      </div>
    </div>
  );
}
