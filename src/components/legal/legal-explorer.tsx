"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, FileText, X } from "lucide-react";

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; tone: "amber" | "slate"; title: string; text?: string; items?: string[] };

export type LegalSection = {
  id: string;
  number: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalAction = {
  label: string;
  href: string;
  primary?: boolean;
};

export function LegalExplorer({
  eyebrow,
  title,
  subtitle,
  lastUpdated,
  sections,
  cta,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
  cta: { title: string; text: string; actions: LegalAction[] };
}) {
  const [selected, setSelected] = useState<LegalSection | null>(null);

  return (
    <main className="relative">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {/* Header */}
        <header className="text-center">
          <span className="inline-flex items-center rounded-full bg-electric-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-electric-600">
            {eyebrow}
          </span>

          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl lg:text-4xl">
            {title}
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">
            {subtitle}
          </p>

          <p className="mt-3 text-[11px] font-medium text-slate-400">
            {lastUpdated}
          </p>
        </header>

        {/* Sections grid */}
        <section
          aria-label={`${title} sections`}
          className="mt-8 grid grid-cols-1 gap-2.5 md:grid-cols-2"
        >
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setSelected(section)}
              className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-electric-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-500 focus-visible:ring-offset-2 sm:px-5"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-electric-50 text-[10px] font-bold text-electric-600">
                  {section.number}
                </span>

                <span className="text-xs font-medium leading-5 text-navy-900 sm:text-sm">
                  {section.title}
                </span>
              </span>

              <ChevronRight
                size={16}
                className="shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-electric-600"
              />
            </button>
          ))}
        </section>

        {/* Bottom CTA */}
        <footer className="mt-8 rounded-xl border border-electric-100 bg-gradient-to-r from-electric-50 to-electric-50 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-electric-100 text-electric-600">
                <FileText size={16} />
              </div>

              <div>
                <p className="text-xs font-semibold text-navy-900 sm:text-sm">
                  {cta.title}
                </p>
                <p className="text-[11px] text-slate-500 sm:text-xs">
                  {cta.text}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {cta.actions.map((action) =>
                action.primary ? (
                  <Link
                    key={action.href + action.label}
                    href={action.href}
                    className="inline-flex items-center justify-center rounded-full bg-electric-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-electric-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-500 focus-visible:ring-offset-2"
                  >
                    {action.label}
                  </Link>
                ) : (
                  <Link
                    key={action.href + action.label}
                    href={action.href}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-electric-200 hover:text-electric-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-500 focus-visible:ring-offset-2"
                  >
                    {action.label}
                  </Link>
                )
              )}
            </div>
          </div>
        </footer>
      </div>
{/* Section Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelected(null);
            }
          }}
        >
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-electric-50 text-electric-600">
                  <span className="text-[10px] font-bold">{selected.number}</span>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-electric-600">
                    {title}
                  </p>

                  <h2
                    id="legal-modal-title"
                    className="mt-1 pr-2 text-sm font-semibold leading-5 text-navy-900 sm:text-base"
                  >
                    {selected.title}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close section"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-500"
              >
                <X size={17} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              {selected.blocks.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 px-5 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full bg-electric-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-electric-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-500 focus-visible:ring-offset-2"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (block.type === "p") {
    return <p className="text-sm leading-7 text-slate-600">{block.text}</p>;
  }

  if (block.type === "list") {
    return (
      <ul className="mt-3 space-y-2 pl-1 text-sm leading-6 text-slate-600">
        {block.items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-electric-400" />
            {item}
          </li>
        ))}
      </ul>
    );
  }

  const staticClass =
    block.tone === "amber"
      ? "border-amber-100 bg-amber-50"
      : "border-slate-200 bg-slate-50";
  const textClass = block.tone === "amber" ? "text-amber-800" : "text-slate-600";
  const titleClass = block.tone === "amber" ? "text-amber-900" : "text-navy-900";

  return (
    <div className={`mt-4 rounded-xl border px-4 py-3.5 ${staticClass}`}>
      <p className={`text-sm font-semibold ${titleClass}`}>{block.title}</p>
      {block.text && (
        <p className={`mt-1 text-sm leading-6 ${textClass}`}>{block.text}</p>
      )}
      {block.items && (
        <ul className={`mt-2 space-y-1.5 text-sm leading-6 ${textClass}`}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}