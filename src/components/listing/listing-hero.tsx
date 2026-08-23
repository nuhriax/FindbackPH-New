import Link from "next/link";
import {
  ArrowRight,
  Lock,
  Plus,
  Radar,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT, type Accent } from "./accents";

type TrustItem = { icon: React.ElementType; label: string };

/**
 * Shared premium hero for the Lost/Found listing pages. Layered ambient glows,
 * a subtle dotted texture and a live-pulse eyebrow frame the headline, a trust
 * row and dual call-to-actions. Renders a small abstract "Report → Match →
 * Return" connection graphic on the right so the header never feels empty.
 */
export function ListingHero({
  accent,
  eyebrow,
  title,
  description,
  ctaHref,
  ctaLabel,
  secondaryHref,
  secondaryLabel,
  trust,
}: {
  accent: Accent;
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  ctaHref: string;
  ctaLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  trust?: TrustItem[];
}) {
  const a = ACCENT[accent];

  const dotBg =
    accent === "found"
      ? "radial-gradient(rgba(16,185,129,0.14) 1px, transparent 1px)"
      : "radial-gradient(rgba(245,158,11,0.14) 1px, transparent 1px)";

  const coolGlow = accent === "found" ? "bg-blue-200/50" : "bg-electric-200/50";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur-sm">
      {/* Layered background */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0",
          accent === "found"
            ? "bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/70"
            : "bg-gradient-to-br from-white via-amber-50/40 to-sunrise-50/60",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full blur-3xl",
          a.glow,
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full blur-3xl",
          coolGlow,
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60 [background-size:28px_28px]"
        style={{ backgroundImage: dotBg }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
      />

      <div className="relative grid gap-8 px-5 py-9 sm:px-7 lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:gap-12 lg:px-12 lg:py-12">
        {/* Left — copy + actions */}
        <div className="max-w-2xl">
          <p
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
              a.border,
              a.bgSoft,
              a.text,
            )}
          >
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                  a.textStrong,
                )}
              />
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full bg-current",
                  a.textStrong,
                )}
              />
            </span>
            {eyebrow}
          </p>

          <h1 className="mt-5 text-3xl font-bold leading-[1.12] tracking-[-0.03em] sm:text-4xl lg:text-[2.75rem]">
            {title}
          </h1>

          <p className="mt-3.5 max-w-xl text-[15px] leading-7">
            {description}
          </p>

          {/* Trust row */}
          {trust && trust.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2.5">
              {trust.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500"
                >
                  <item.icon
                    aria-hidden="true"
                    className={cn("h-4 w-4", a.text)}
                  />
                  {item.label}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href={ctaHref}
              className={cn(
                "group inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-white shadow-lg shadow-black/5 transition-all duration-200 hover:-translate-y-0.5",
                a.button,
                a.buttonHover,
              )}
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              {ctaLabel}
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>

            {secondaryHref && secondaryLabel && (
              <Link
                href={secondaryHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-6 text-sm font-semibold text-navy-900 shadow-sm backdrop-blur transition-colors hover:border-slate-300 hover:bg-white"
              >
                <Radar aria-hidden="true" className="h-4 w-4" />
                {secondaryLabel}
              </Link>
            )}
          </div>
        </div>

        {/* Right — abstract connection graphic */}
        <div className="relative hidden lg:block" aria-hidden="true">
          <div
            className={cn(
              "absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl",
              a.glow,
            )}
          />
          <div className="relative mx-auto flex max-w-xs flex-col gap-3">
            <HeroPhaseStep
              icon={Plus}
              title="Report"
              caption="Post the item in seconds"
              tone={a}
            />
            <div className="ml-6 h-7 w-px bg-gradient-to-b from-slate-200 to-slate-100" />
            <HeroPhaseStep
              icon={Sparkles}
              title="Match"
              caption="We surface possible matches"
              tone={a}
            />
            <div className="ml-6 h-7 w-px bg-gradient-to-b from-slate-200 to-slate-100" />
            <HeroPhaseStep
              icon={ShieldCheck}
              title="Reunite"
              caption="Connect safely with the owner"
              tone={a}
            />

            <div className="mt-3 flex items-center justify-center gap-3 text-[11px] font-medium text-slate-500">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border bg-white/80 px-2.5 py-1",
                  a.border,
                )}
              >
                <Lock aria-hidden="true" className="h-3 w-3" />
                Contact stays private
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A single labeled step inside the hero's connection graphic. */
function HeroPhaseStep({
  icon: Icon,
  title,
  caption,
  tone,
}: {
  icon: React.ElementType;
  title: string;
  caption: string;
  tone: (typeof ACCENT)["lost"];
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3.5 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.4)] backdrop-blur">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
          tone.border,
          tone.bgSoft,
          tone.text,
        )}
      >
        <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-navy-900">
          {title}
        </span>
        <span className="block truncate text-[11px] text-slate-500">
          {caption}
        </span>
      </span>
    </div>
  );
}
