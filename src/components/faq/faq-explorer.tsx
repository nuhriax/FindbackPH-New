"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronRight,
  MessageCircle,
  Search,
  X,
} from "lucide-react";

export type Faq = { q: string; a: string };

export function FaqExplorer({ faqs }: { faqs: Faq[] }) {
  const [selectedFaq, setSelectedFaq] = useState<Faq | null>(null);

  return (
    <main className="relative">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {/* Header */}
        <header className="text-center">
          <span className="inline-flex items-center rounded-full bg-electric-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-electric-600">
            Help center
          </span>

          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl lg:text-4xl">
            Frequently Asked Questions
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">
            Everything you need to know about finding, reporting, and safely
            returning lost items with FindBack PH.
          </p>
        </header>

        {/* FAQ grid */}
        <section
          aria-label="Frequently asked questions"
          className="mt-8 grid grid-cols-1 gap-2.5 md:grid-cols-2"
        >
          {faqs.map((faq, index) => (
            <button
              key={faq.q}
              type="button"
              onClick={() => setSelectedFaq(faq)}
              className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-electric-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-500 focus-visible:ring-offset-2 sm:px-5"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-electric-50 text-[10px] font-bold text-electric-600">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="text-xs font-medium leading-5 text-navy-900 sm:text-sm">
                  {faq.q}
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
                <MessageCircle size={16} />
              </div>

              <div>
                <p className="text-xs font-semibold text-navy-900 sm:text-sm">
                  Still have questions?
                </p>
                <p className="text-[11px] text-slate-500 sm:text-xs">
                  Our team is happy to help.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-electric-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-electric-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-500 focus-visible:ring-offset-2"
              >
                Contact us
              </Link>

              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-electric-200 hover:text-electric-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-500 focus-visible:ring-offset-2"
              >
                <Search size={14} />
                Browse
              </Link>
            </div>
          </div>
        </footer>
      </div>
{/* Answer Modal */}
      {selectedFaq && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="faq-modal-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedFaq(null);
            }
          }}
        >
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-electric-50 text-electric-600">
                  <MessageCircle size={17} />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-electric-600">
                    FAQ
                  </p>

                  <h2
                    id="faq-modal-title"
                    className="mt-1 pr-2 text-sm font-semibold leading-5 text-navy-900 sm:text-base"
                  >
                    {selectedFaq.q}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFaq(null)}
                aria-label="Close answer"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-500"
              >
                <X size={17} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 py-5 sm:px-6 sm:py-6">
              <p className="text-sm leading-7 text-slate-600">
                {selectedFaq.a}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 px-5 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setSelectedFaq(null)}
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