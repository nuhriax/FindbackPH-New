"use client";

// ---------------------------------------------------------------------------
// ReportWizard — shared 4-step wizard behind /report/lost and /report/found.
//
// Single source of truth for the whole report flow: step routing, validation
// gating, draft autosave, map pin, review snapshot, success screen.
//
// Layout now reads top-down as a thin shell:
//
//   ┌─ WizardHeader ─────────────┐
//   ├─ ReportStepsIndicator ─────┤  (shared component)
//   ├─ Form ─────────────────────┤
//   │   ├─ DraftAutoSave         │
//   │   ├─ StepItemDetails       │
//   │   ├─ StepLocation          │
//   │   ├─ StepPhotos            │
//   │   ├─ StepReview            │
//   │   ├─ WizardError           │
//   │   └─ WizardNav (sticky)    │
//   └────────────────────────────┘
//
// Behavior is unchanged: same fields, same FormData names, same DraftAutoSave
// contract, same server actions, same analytics events, same hash routing.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { DraftAutoSave } from "./draft-autosave";
import { track, flushSync } from "@/lib/analytics-client";
import { uploadItemImagesClient } from "@/lib/file-upload-client";
import type { ColorValue } from "@/lib/validation";

import {
  CONFIG,
  TOTAL_STEPS,
  type ReviewSnapshot,
  type WizardKind,
} from "./report-wizard-config";
import { WizardHeader } from "./wizard/wizard-header";
import { WizardNav } from "./wizard/wizard-nav";
import { WizardError } from "./wizard/wizard-error";
import { WizardSuccess } from "./wizard/wizard-success";
import { MobileStepIndicator } from "./wizard/mobile-step-indicator";
import { StepItemDetails } from "./wizard/step-item-details";
import { StepLocation } from "./wizard/step-location";
import { StepPhotos } from "./wizard/step-photos";
import { StepReview } from "./wizard/step-review";
import type { ReviewEditStep } from "./wizard/wizard-review-list";

export function ReportWizard({ kind }: { kind: WizardKind }) {
  const cfg = CONFIG[kind];
  const accent = cfg.accent;

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<File[]>([]);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  // Furthest step reached — enables back-navigation and sidebar jumping.
  const [maxStep, setMaxStep] = useState(1);
  // Read-only summary shown on the Review step so users see exactly what
  // will be published before they commit.
  const [review, setReview] = useState<ReviewSnapshot | null>(null);
  // Set when the server tells us the session expired mid-flow, so we can
  // offer a sign-in link instead of a dead-end error.
  const [authRequired, setAuthRequired] = useState(false);
  // Optional "Pin exact location" coordinate captured on the Where & when
  // step. Kept in state (instead of relying only on the hidden inputs) so the
  // marker and the coordinate readout can render live.
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  // Live character count for the description field (0/500 readout).
  const [descLen, setDescLen] = useState(0);
  // Optional primary color chosen via the swatch picker on Step 1.
  const [color, setColor] = useState<ColorValue | "">("");
  // Reward quick-select chip state for the lost-report flow.
  const [rewardChip, setRewardChip] = useState<number | null>(null);
  // Which photo index is the report cover (the first one by default).
  const [coverIndex, setCoverIndex] = useState(0);
  // Cascading location selects: chosen province drives the city options.
  const [provinceVal, setProvinceVal] = useState("");
  const [cityVal, setCityVal] = useState("");
  // Selected category — drives the category-aware title placeholder/example so
  // a wallet reporter doesn't see "Black iPhone 15 Pro" as the example.
  const [categoryVal, setCategoryVal] = useState("");

  // ── Product analytics: report funnel ──────────────────────────────────────
  const submittedRef = useRef(false);
  const stepRef = useRef(1);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  useEffect(() => {
    track("report_started", "reports", { kind });
  }, [kind]);
  useEffect(() => {
    track("report_step", "reports", { kind, step });
  }, [kind, step]);
  useEffect(
    () => () => {
      if (!submittedRef.current) {
        track("report_abandoned", "reports", { kind, last_step: stepRef.current });
        flushSync();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ── Browser back/forward + reload resume ─────────────────────────────────
  const readHashStep = () => {
    const n = Number(window.location.hash.replace("#step-", ""));
    return Number.isInteger(n) && n >= 1 && n <= TOTAL_STEPS ? n : 1;
  };
  useEffect(() => {
    const initial = readHashStep();
    if (initial > 1) {
      setStep(initial);
      setMaxStep(initial);
    }
    const onPopState = () => {
      setError(null);
      const n = readHashStep();
      setStep(n);
      setMaxStep((m) => Math.max(m, n));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draft restore for the cascading location selects. DraftAutoSave restores
  // the raw fields, but the city list depends on the chosen province — so we
  // mirror the restored values into React state here (same storage key).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(cfg.storageKey);
      if (!raw) return;
      const d = JSON.parse(raw) as Record<string, string>;
      setProvinceVal(d.province ?? "");
      setCityVal(d.city ?? "");
      setCategoryVal(d.category ?? "");
      setColor((d.color as ColorValue) ?? "");
      setDescLen((d.description ?? "").length);
      setRewardChip(d.rewardAmount ? Number(d.rewardAmount) : null);
      const latitude = Number(d.latitude);
      const longitude = Number(d.longitude);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) setPin({ lat: latitude, lng: longitude });
    } catch {
      /* corrupted draft — ignore */
    }
  }, [cfg.storageKey]);

  function goToStep(next: number) {
    setError(null);
    if (next > step) {
      const container = document.getElementById(`step-${step}`);
      if (container) {
        for (const el of Array.from(
          container.querySelectorAll<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
          >("input, textarea, select")
        )) {
          if (!el.checkValidity()) {
            el.reportValidity();
            return;
          }
          // Block whitespace-only values on required text fields.
          if (
            (el.name === "title" || el.name === "description") &&
            el.value.trim().length === 0
          ) {
            el.setCustomValidity(
              el.name === "title"
                ? "Please enter an item name (spaces don't count)."
                : "Please describe the item (spaces don't count)."
            );
            el.reportValidity();
            el.setCustomValidity("");
            return;
          }
        }
      }
    }
    // Snapshot the form into a read-only summary for the Review step.
    if (next === TOTAL_STEPS && next > step) {
      // Earlier steps unmount as the user advances, so FormData only sees the
      // fields still mounted. DraftAutoSave keeps every named field in
      // localStorage — use it as the source of truth for unmounted fields.
      let draft: Record<string, string> = {};
      try {
        const raw = window.localStorage.getItem(cfg.storageKey);
        if (raw) draft = JSON.parse(raw) as Record<string, string>;
      } catch {
        /* corrupted draft — fall back to FormData only */
      }
      const form = document.getElementById(cfg.formId) as HTMLFormElement | null;
      if (form) {
        const fd = new FormData(form);
        // Mounted field value wins; otherwise fall back to the saved draft.
        const get = (name: string) =>
          fd.get(name)?.toString() || draft[name] || "";
        const latStr = get("latitude");
        const lngStr = get("longitude");
        setReview({
          title: get("title"),
          category: get("category"),
          color: get("color"),
          description: get("description"),
          date: get(cfg.dateName),
          city: get("city"),
          province: get("province"),
          approximateLocation: get("approximateLocation"),
          timeWindow: get("timeWindow"),
          hasPrivateDetail: Boolean(get("distinguishingFeatures").trim()),
          currentHoldingInfo:
            cfg.extraField === "holding" ? get("currentHoldingInfo") : undefined,
          pinned:
            latStr && lngStr
              ? `${Number(latStr).toFixed(6)}, ${Number(lngStr).toFixed(6)}`
              : "",
        });
      }
    }
    const target = Math.min(TOTAL_STEPS, Math.max(1, next));
    setStep(target);
    setMaxStep((m) => Math.max(m, target));
    // Keep the URL hash in sync so Back/Forward and reloads resume the wizard.
    window.history.pushState(null, "", `#step-${target}`);
  }

  async function handleSubmit(formData: FormData) {
    if (step !== TOTAL_STEPS) return;
    // Double-submit guard: a rapid second click (or Enter) while the server
    // action is in flight must not create a duplicate report.
    if (isPending) return;

    const form = document.getElementById(cfg.formId) as HTMLFormElement | null;
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Server-side schema also trims; these give instant, friendly feedback.
    const title = formData.get("title")?.toString() ?? "";
    const description = formData.get("description")?.toString() ?? "";
    if (title.trim().length < 3) {
      setError("Please enter an item name (at least 3 characters — spaces don't count).");
      setStep(1);
      return;
    }
    if (description.trim().length < 10) {
      setError("Please describe the item in at least 10 characters (spaces don't count).");
      setStep(1);
      return;
    }
    // Selected photos are uploaded separately through the route handler —
    // Server Actions can't accept File objects (Next.js only serializes
    // JSON-like values), so we never put them into `formData`.
    setError(null);
    startTransition(async () => {
      const result = await cfg.action(formData);
      if (result?.error) {
        setError(result.error);
        if (/signed in/i.test(result.error)) setAuthRequired(true);
        track("report_submit_error", "reports", { kind, stage: "create" });
        return;
      }
      if (!result?.itemId) {
        setError("We couldn't save your report. Please try again.");
        track("report_submit_error", "reports", { kind, stage: "create" });
        return;
      }

      // Put the chosen cover photo first — the API uses the first image as
      // the report cover, so the user's selection is respected.
      const orderedImages =
        coverIndex > 0 && coverIndex < images.length
          ? [images[coverIndex], ...images.filter((_, i) => i !== coverIndex)]
          : images;

      const uploadErr = await uploadItemImagesClient(
        cfg.itemType,
        result.itemId,
        orderedImages
      );
      if (uploadErr) {
        // Roll back the just-created report so a failed photo upload doesn't
        // leave an orphan report behind.
        try {
          await fetch(`/api/items/${result.itemId}`, { method: "DELETE" });
        } catch {
          /* best effort */
        }
        setError(uploadErr);
        track("report_submit_error", "reports", { kind, stage: "upload" });
        return;
      }

      submittedRef.current = true;
      track("report_submitted", "reports", { kind, photos: images.length });
      // Drop the #step-N hash — the wizard is done.
      window.history.replaceState(null, "", window.location.pathname);
      setConfirmedId(result.itemId);
    });
  }

  const handleReportAnother = () => {
    setConfirmedId(null);
    setStep(1);
    setMaxStep(1);
    window.history.replaceState(null, "", window.location.pathname);
    setReview(null);
    setImages([]);
    setPin(null);
    setColor("");
    setRewardChip(null);
    setCoverIndex(0);
  };

  const handleEditStep = (target: ReviewEditStep) => goToStep(target);

  if (confirmedId) {
    return (
      <WizardSuccess
        cfg={cfg}
        itemId={confirmedId}
        itemTitle={review?.title ?? ""}
        onReportAnother={handleReportAnother}
      />
    );
  }

  return (
    <div className="report-wizard py-8 lg:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <WizardHeader
          eyebrowIcon={cfg.eyebrowIcon}
          eyebrowLabel={cfg.eyebrowLabel}
          title={cfg.heroTitle}
          lead={cfg.heroLead}
          accent={accent}
        />

        <p className="mt-5 text-center text-sm text-slate-500">
          {kind === "lost" ? "Found something instead?" : "Lost something instead?"}{" "}
          <Link href={kind === "lost" ? "/report/found" : "/report/lost"} className={`${accent.text} font-semibold underline-offset-4 hover:underline`}>
            Report it here
          </Link>
        </p>

        <div className="mx-auto mt-10 grid w-full max-w-6xl gap-8 lg:grid-cols-[13rem,minmax(0,50rem)] lg:items-start lg:justify-center">
          <aside className="hidden lg:block lg:sticky lg:top-24">
            <nav aria-label="Report steps" className="rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-sm backdrop-blur">
              <p className="px-2 pb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Your report</p>
              <ol className="space-y-1">
                {cfg.captions.map((caption, index) => {
                  const number = index + 1;
                  const reachable = number <= maxStep;
                  const active = number === step;
                  return <li key={caption}>
                    <button type="button" disabled={!reachable} onClick={() => goToStep(number)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${active ? `${accent.chipActive} ${accent.chipActiveTitle}` : reachable ? "text-slate-600 hover:bg-slate-50" : "cursor-not-allowed text-slate-400"}`}>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${number < step ? `${accent.chipDone}` : active ? `${accent.chipActiveIcon} text-white` : "bg-slate-100 text-slate-500"}`}>{number < step ? "✓" : number}</span>
                      <span>{caption.replace(/^Step \d+ · /, "")}</span>
                    </button>
                  </li>;
                })}
              </ol>
              <p className="mt-3 border-t border-slate-100 px-2 pt-3 text-xs leading-5 text-slate-500">Your progress saves automatically on this device.</p>
            </nav>
          </aside>
          {/* Main form column */}
          <div className="min-w-0">
          {/* Mobile step indicator */}
          <div className="lg:hidden">
              <MobileStepIndicator
                currentStep={step}
                totalSteps={TOTAL_STEPS}
                accent={accent}
                captions={cfg.captions}
              />
            </div>

            <form
            id={cfg.formId}
            action={handleSubmit}
            onSubmit={(e) => {
              // Kill every submission path that isn't the explicit
              // "Submit report" button on the Review step — Enter in a
              // field, browser autofill, or a double-click must never fire
              // the server action early. preventDefault() stops the React
              // `action` from running at all.
              if (step !== TOTAL_STEPS || isPending) e.preventDefault();
            }}
            onKeyDown={(e) => {
              // Block Enter-to-submit from single-line inputs so users can't
              // skip ahead of the multi-step wizard accidentally.
              if (
                e.key === "Enter" &&
                (e.target as HTMLElement).tagName === "INPUT"
              ) {
                e.preventDefault();
              }
            }}
            className="space-y-6"
          >
            <DraftAutoSave
              formId={cfg.formId}
              storageKey={cfg.storageKey}
              active={confirmedId === null}
            />

            <StepItemDetails
              kind={kind}
              cfg={cfg}
              isActive={step === 1}
              categoryVal={categoryVal}
              setCategoryVal={setCategoryVal}
              color={color}
              setColor={setColor}
              descLen={descLen}
              setDescLen={setDescLen}
            />

            <StepLocation
              cfg={cfg}
              isActive={step === 2}
              provinceVal={provinceVal}
              setProvinceVal={setProvinceVal}
              cityVal={cityVal}
              setCityVal={setCityVal}
              pin={pin}
              setPin={setPin}
              rewardChip={rewardChip}
              setRewardChip={setRewardChip}
            />

            <StepPhotos
              kind={kind}
              accent={accent}
              isActive={step === 3}
              images={images}
              setImages={setImages}
              coverIndex={coverIndex}
              setCoverIndex={setCoverIndex}
            />

            <StepReview
              cfg={cfg}
              isActive={step === TOTAL_STEPS}
              review={review}
              imageCount={images.length}
              onEditStep={handleEditStep}
            />

            {error && (
              <WizardError
                message={error}
                authRequired={authRequired}
                kind={kind}
              />
            )}

            {/* Draft reassurance — same for both wizards, mirrors DraftAutoSave. */}
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Your progress is saved automatically on this device, so you can
              safely finish later.
            </p>

            <WizardNav
              step={step}
              totalSteps={TOTAL_STEPS}
              isPending={isPending}
              accent={accent}
              continueLabels={cfg.continueLabels}
              publishLabel={cfg.publishLabel}
              onBack={() => goToStep(step - 1)}
              onNext={() => goToStep(step + 1)}
            />
          </form>
        </div>
        {/* close form column */}
        </div>
        {/* close desktop grid */}
      </div>
      {/* close max-w container */}
    </div>
  );
}
