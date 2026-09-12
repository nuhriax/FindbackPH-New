"use client";

// ---------------------------------------------------------------------------
// WizardSuccess — celebratory success screen shared by both report flows.
//
// Enhanced with confetti-like animation, better CTAs, and improved
// visual hierarchy.
// ---------------------------------------------------------------------------

import Link from "next/link";
import { useState } from "react";
import { Check, CheckCircle2, Share2, Printer, ArrowRight, Home } from "lucide-react";
import { MotionReveal } from "@/components/effects/motion-reveal";
import type { AccentPalette, WizardConfig } from "../report-wizard-config";

export function WizardSuccess({
  cfg,
  itemId,
  itemTitle,
  onReportAnother,
}: {
  cfg: WizardConfig;
  itemId: string;
  itemTitle: string;
  onReportAnother: () => void;
}) {
  const [shareCopied, setShareCopied] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const share = async () => {
    setActiveAction("share");
    const url = `${window.location.origin}${cfg.success.basePath}/${itemId}`;
    const data = { title: cfg.success.shareTitle, text: cfg.success.shareText, url };
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(data);
        setActiveAction(null);
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setActiveAction(null);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      setActiveAction(null);
    }
  };

  const printReport = () => {
    setActiveAction("print");
    window.print();
    setActiveAction(null);
  };

  return (
    <div className="relative py-12 lg:py-20">
      {/* Animated background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-4 h-80 w-[40rem] max-w-full -translate-x-1/2 rounded-full bg-emerald-300/20 blur-3xl animate-pulse"
      />

      <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
        {/* Success icon with animation */}
        <MotionReveal>
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
            {/* Outer ring animation */}
            <span
              aria-hidden="true"
              className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-20"
            />
            {/* Middle ring */}
            <span
              aria-hidden="true"
              className="absolute inline-flex h-20 w-20 animate-pulse rounded-full bg-emerald-200/30"
            />
            {/* Inner icon container */}
            <span className="relative flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-xl shadow-emerald-200/50 transition-transform duration-500 hover:scale-110">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </span>
          </div>
        </MotionReveal>

        {/* Title with gradient */}
        <MotionReveal delay={100}>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
            {cfg.success.title}{" "}
            <span className="bg-gradient-to-r from-electric-600 via-electric-400 to-sun-400 bg-clip-text text-transparent animate-gradient">
              live!
            </span>
          </h1>
        </MotionReveal>

        {/* Lead text */}
        <MotionReveal delay={200}>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
            {cfg.success.lead}
          </p>
        </MotionReveal>

        {/* Next steps cards */}
        <MotionReveal delay={300}>
          <ol className="mx-auto mt-10 flex max-w-lg flex-col gap-3 text-left">
            {cfg.success.steps.map(([t, d], i) => (
              <SuccessStep
                key={t}
                index={i + 1}
                title={t}
                description={d}
                accent={cfg.accent}
              />
            ))}
          </ol>
        </MotionReveal>

        {/* Primary actions */}
        <MotionReveal delay={400}>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={`${cfg.success.basePath}/${itemId}`}
              className="btn-primary group flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            >
              <span>View your report</span>
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <button
              type="button"
              onClick={share}
              disabled={activeAction === "share"}
              className="btn-secondary flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              {shareCopied ? (
                <>
                  <Check size={16} aria-hidden={true} />
                  <span>Link copied!</span>
                </>
              ) : activeAction === "share" ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-transparent" />
                  <span>Sharing…</span>
                </>
              ) : (
                <>
                  <Share2 size={16} aria-hidden={true} />
                  <span>Share report</span>
                </>
              )}
            </button>
          </div>
        </MotionReveal>

        {/* Secondary actions */}
        <MotionReveal delay={500}>
          <div className="mt-3 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={printReport}
              disabled={activeAction === "print"}
              className="btn-secondary flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              <Printer size={16} aria-hidden={true} />
              <span>Print report</span>
            </button>
            <button
              type="button"
              onClick={onReportAnother}
              className="btn-secondary flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
            >
              <span>Report another item</span>
            </button>
            <Link
              href={`/discover?q=${encodeURIComponent(itemTitle)}&type=${cfg.itemType === "lost_item" ? "found" : "lost"}`}
              className="btn-secondary flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
            >
              <span>Browse potential matches</span>
            </Link>
            <Link
              href="/"
              className="btn-secondary flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
            >
              <Home size={16} aria-hidden={true} />
              <span>Return home</span>
            </Link>
          </div>
        </MotionReveal>

        {/* Tip */}
        <MotionReveal delay={600}>
          <p className="mt-8 text-xs text-slate-500">{cfg.success.tip}</p>
        </MotionReveal>
      </div>
    </div>
  );
}

function SuccessStep({
  index,
  title,
  description,
  accent,
}: {
  index: number;
  title: string;
  description: string;
  accent: AccentPalette;
}) {
  return (
    <li
      className={[
        "group flex items-start gap-3 rounded-2xl border p-4 backdrop-blur transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-md",
        accent.hoverBorder,
        "border-slate-200/70 bg-white/80",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-110",
          accent.stepCircle,
        ].join(" ")}
      >
        {index}
      </span>
      <div>
        <p className="text-sm font-semibold text-navy-900">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
    </li>
  );
}
