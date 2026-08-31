import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Shared structural kit for the content pages (How It Works / Safety / About).
 * One consistent skeleton — hero → sections of cards → CTA — while each page
 * supplies its own content and personality. All tokens come from the FindBack
 * PH theme: warm-sand body, translucent white cards, warm espresso shadows,
 * electric teal accents.
 */

const TONES: Record<string, string> = {
  electric: "border-electric-200 bg-electric-50 text-electric-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  sunrise: "border-sunrise-200 bg-sunrise-50 text-sunrise-700",
  navy: "border-slate-200 bg-slate-50 text-navy-800",
};

const DOTS: Record<string, string> = {
  electric: "bg-electric-500",
  emerald: "bg-emerald-500",
  sunrise: "bg-sunrise-500",
  navy: "bg-navy-700",
};

/* ------------------------------------------------------------------ HERO */

export function PageHero({
  eyebrow,
  icon: Icon,
  title,
  highlight,
  titleAfter,
  description,
  trust,
}: {
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  /** Word(s) inside the title rendered in the brand accent. */
  highlight?: string;
  titleAfter?: string;
  description: string;
  trust?: string[];
}) {
  return (
    <section className="relative border-b border-slate-200/60">
      {/* Soft brand wash behind the hero type — breaks the flat-white feel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(720px_320px_at_50%_-20%,rgba(15,123,122,0.10),transparent_70%),radial-gradient(560px_260px_at_85%_10%,rgba(245,147,65,0.07),transparent_65%)]"
      />
      <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-electric-200 bg-white/85 px-3.5 py-1.5 text-xs font-semibold text-electric-700 shadow-sm backdrop-blur">
          <Icon aria-hidden="true" size={13} />
          {eyebrow}
        </span>

        <h1 className="display-hero mt-6 text-4xl sm:text-5xl lg:text-[3.75rem]">
          {title}
          {highlight && (
            <>
              {" "}
              <span className="text-gradient-brand">{highlight}</span>
            </>
          )}
          {titleAfter && <> {titleAfter}</>}
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
          {description}
        </p>

        {trust && trust.length > 0 && (
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {trust.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/85 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm"
              >
                <span
                  aria-hidden="true"
                  className={DOTS.electric + " h-1.5 w-1.5 rounded-full"}
                />
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- SECTION */

export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-electric-700">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.025em] text-navy-900 sm:text-4xl">
          {title}
        </h2>
        {lead && (
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            {lead}
          </p>
        )}
      </div>
      <div className="mt-7">{children}</div>
    </section>
  );
}


/* ------------------------------------------------------------------ CARD */

export function InfoCard({
  icon: Icon,
  title,
  text,
  tone = "electric",
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  tone?: "electric" | "emerald" | "sunrise" | "navy";
}) {
  return (
    <div className="h-full rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-soft transition-shadow duration-200 hover:shadow-card">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${TONES[tone]}`}
      >
        <Icon aria-hidden="true" size={18} />
      </span>
      <h3 className="mt-3.5 text-sm font-semibold text-navy-900">{title}</h3>
      <p className="mt-1.5 text-xs leading-6 text-slate-600 sm:text-sm">
        {text}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ CHECK CARD */

export function CheckCard({
  icon: Icon,
  title,
  items,
  tone = "electric",
}: {
  icon: LucideIcon;
  title: string;
  items: string[];
  tone?: "electric" | "emerald" | "sunrise" | "navy";
}) {
  return (
    <div className="h-full rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-soft transition-shadow duration-200 hover:shadow-card">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${TONES[tone]}`}
        >
          <Icon aria-hidden="true" size={18} />
        </span>
        <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-xs leading-6 text-slate-600 sm:text-sm"
          >
            <span
              aria-hidden="true"
              className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${DOTS[tone]}`}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------- STEP CARD */

export function StepCard({
  number,
  icon: Icon,
  title,
  text,
}: {
  number: string;
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="relative h-full rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-soft transition-shadow duration-200 hover:shadow-card">
      <span className="absolute right-4 top-4 font-mono text-xs font-semibold text-slate-300">
        {number}
      </span>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-electric-200 bg-electric-50 text-electric-700">
        <Icon aria-hidden="true" size={18} />
      </span>
      <h3 className="mt-3.5 text-sm font-semibold text-navy-900">{title}</h3>
      <p className="mt-1.5 text-xs leading-6 text-slate-600 sm:text-sm">
        {text}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- FAQ (raw) */

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {items.map((item) => (
        <details
          key={item.q}
          className="group rounded-2xl border border-slate-200/70 bg-white/85 shadow-soft transition-shadow duration-200 open:shadow-card"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-200 [&::-webkit-details-marker]:hidden">
            {item.q}
            <ArrowRight
              aria-hidden="true"
              size={15}
              className="shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-90"
            />
          </summary>
          <p className="border-t border-slate-100 px-5 py-4 text-xs leading-6 text-slate-600 sm:text-sm">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- CTA BAND */

export function CTABand({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions: { href: string; label: string; primary?: boolean }[];
}) {
  return (
    <section className="relative mt-8 overflow-hidden">
      {/* Route-line motif — the journey continues, drawn faintly across the band */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.22]"
      >
        <path
          d="M-40 150 C 240 90, 380 170, 640 120 C 900 70, 1080 150, 1480 60"
          fill="none"
          stroke="#0e3330"
          strokeWidth="1.5"
          strokeDasharray="2 10"
          strokeLinecap="round"
        />
        <circle cx="640" cy="120" r="4" fill="#0f7b7a" />
        <circle cx="1080" cy="118" r="4" fill="#f59341" />
      </svg>

      <div className="relative mx-auto max-w-5xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="flex flex-col gap-8 rounded-3xl border border-white/60 bg-white/70 p-7 shadow-sm shadow-navy-900/5 backdrop-blur-sm sm:p-9 lg:flex-row lg:items-center lg:justify-between lg:p-10">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-electric-700">
              FindBack PH
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold leading-[1.12] tracking-tight text-[#17322f] sm:text-3xl">
              {title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[#3d2f22]/75 sm:text-base">
              {description}
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            {actions.map((action) =>
              action.primary ? (
                <Link
                  key={action.href}
                  href={action.href}
                  className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-button bg-electric-800 px-7 text-sm font-semibold text-white shadow-lg shadow-electric-900/15 transition hover:-translate-y-px hover:bg-electric-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-electric-800/25 active:translate-y-0"
                >
                  {action.label}
                  <ArrowRight aria-hidden="true" size={15} />
                </Link>
              ) : (
                <Link
                  key={action.href}
                  href={action.href}
                  className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-button border border-electric-800/25 bg-white/60 px-7 text-sm font-semibold text-[#17322f] transition hover:-translate-y-px hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-electric-800/15 active:translate-y-0"
                >
                  {action.label}
                </Link>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


