"use client";

// ---------------------------------------------------------------------------
// WizardSuccess â€” celebratory success screen shared by both report flows.
//
// Enhanced with confetti-like animation, better CTAs, and improved
// visual hierarchy.
// ---------------------------------------------------------------------------

import Link from "next/link";
import { useState } from "react";
import { Check, CheckCircle2, Share2, ArrowRight } from "lucide-react";
import { MotionReveal } from "@/components/effects/motion-reveal";
import type { WizardConfig } from "../report-wizard-config";

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
        // user cancelled â€” fall through to copy
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

      <div className="relative mx-auto max-w-xl px-4 text-center sm:px-6">
        {/* Success icon with animation */}
        <MotionReveal>
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
            <span
              aria-hidden="true"
              className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-20"
            />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-xl shadow-emerald-200/50">
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

        {/* The report itself â€” anchors the moment to something concrete */}
        <MotionReveal delay={150}>
          <Link
            href={`${cfg.success.basePath}/${itemId}`}
            className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
            <span className="truncate">{itemTitle}</span>
            <span className="shrink-0 text-xs font-semibold text-slate-400">view â†’</span>
          </Link>
        </MotionReveal>

        {/* Lead text */}
        <MotionReveal delay={200}>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
            {cfg.success.lead}
          </p>
        </MotionReveal>

        {/* Next steps â€” connected timeline */}
        <MotionReveal delay={300}>
          <ol className="relative mx-auto mt-8 max-w-sm text-left">
            {/* vertical rail */}
            <span
              aria-hidden="true"
              className="absolute bottom-3 left-[13px] top-3 w-px bg-gradient-to-b from-emerald-300 via-slate-200 to-slate-200"
            />
            {cfg.success.steps.map(([t, d], i) => (
              <li key={t} className="relative flex items-start gap-4 pb-5 last:pb-0">
                <span
                  className={[
                    "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm ring-4 ring-white",
                    i === 0
                      ? "bg-emerald-500"
                      : "bg-gradient-to-br " + cfg.accent.stepCircle,
                  ].join(" ")}
                >
                  {i === 0 ? <Check size={13} strokeWidth={3} /> : i + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-navy-900">{t}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{d}</p>
                </div>
              </li>
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
                  <span>Sharingâ€¦</span>
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

        {/* Secondary actions â€” quiet text links, single row */}
        <MotionReveal delay={500}>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-sm text-slate-500">
            <Link
              href={`/discover?q=${encodeURIComponent(itemTitle)}&type=${cfg.itemType === "lost_item" ? "found" : "lost"}`}
              className="rounded-lg px-2 py-1.5 font-medium transition hover:bg-slate-100 hover:text-slate-700"
            >
              Browse matches
            </Link>
            <span aria-hidden="true" className="text-slate-300">Â·</span>
            <button
              type="button"
              onClick={onReportAnother}
              className="rounded-lg px-2 py-1.5 font-medium transition hover:bg-slate-100 hover:text-slate-700"
            >
              Report another
            </button>
            <span aria-hidden="true" className="text-slate-300">Â·</span>
            <button
              type="button"
              onClick={printReport}
              disabled={activeAction === "print"}
              className="rounded-lg px-2 py-1.5 font-medium transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              Print
            </button>
            <span aria-hidden="true" className="text-slate-300">Â·</span>
            <Link
              href="/"
              className="rounded-lg px-2 py-1.5 font-medium transition hover:bg-slate-100 hover:text-slate-700"
            >
              Home
            </Link>
          </div>
        </MotionReveal>

        {/* Tip */}
        <MotionReveal delay={600}>
          <p className="mx-auto mt-6 max-w-sm text-xs text-slate-400">{cfg.success.tip}</p>
        </MotionReveal>
      </div>
    </div>
  );
}
