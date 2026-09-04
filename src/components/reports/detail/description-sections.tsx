import { ArrowUpRight, Check, Lock, ScanSearch } from "lucide-react";
import Link from "next/link";

import type { DetailItem } from "../report-detail-types";

/*
 * ABOUT + IDENTIFYING DETAILS — flat, borderless content blocks
 * designed to flow inside the unified body panel (the panel
 * supplies the surface, padding and rounding; these supply
 * only the section rhythm: numbered headers + quiet dividers).
 */

export function DescriptionSections({
  item,
  locked = false,
  onUnlock,
}: {
  item: DetailItem;
  /** When true, identifying details are hidden until ownership is verified. */
  locked?: boolean;
  /** Text shown on the locked overlay CTA. */
  onUnlock?: string;
}) {
  /* Split identifying details into checkable items (lines or commas). */
  const featureItems = (item.distinguishingFeatures ?? "")
    .split(/\r?\n|•|,/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <section>
      {/* Description */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Description
        </p>

        <p className="mt-2 whitespace-pre-line text-[15px] leading-7 text-slate-600">
          {item.description || "No description provided."}
        </p>
      </div>

      {/* Verification question — private until contact is requested */}
      <div className="mt-6 border-t border-slate-200/80 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Verification
        </p>

        {locked ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            {/* Card header */}
            <div className="flex items-start gap-2.5">
              <span
                className="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-slate-100
                  text-slate-500
                "
              >
                <Lock size={14} />
              </span>

              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">
                  Verification question — private
                </p>

                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                  Shown only to a claimant who requests contact.
                </p>
              </div>
            </div>

            {/* Blurred private content — shape without the substance */}
            <div
              aria-hidden
              className="pointer-events-none mt-3 select-none blur-[5px]"
            >
              <p className="text-sm leading-6 text-slate-600">
                {featureItems.length > 0
                  ? featureItems.join(" · ")
                  : "Ask the claimant to confirm a specific identifying detail about the item."}
              </p>
            </div>

            <Link
              href="#ownership-verify"
              className="
                mt-4
                flex
                w-full
                items-center
                justify-center
                gap-1.5
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-3
                text-sm
                font-bold
                text-slate-900
                shadow-sm
                transition-colors
                hover:border-slate-300
                hover:bg-slate-50
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-electric-400/50
              "
            >
              {onUnlock ===
              "Answer the reporter's private questions to view these details."
                ? "Answer questions to unlock"
                : "Request contact to unlock"}
              <ArrowUpRight size={14} />
            </Link>
          </div>
        ) : featureItems.length > 0 ? (
          <div className="mt-3 rounded-xl border border-electric-100 bg-electric-50/60 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-electric-800">
              <ScanSearch size={13} />
              Ask the claimant to confirm these details:
            </p>

            <ul className="mt-3 space-y-2.5">
              {featureItems.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm leading-6 text-slate-700"
                >
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-electric-300 bg-white text-electric-600">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-2 text-[15px] leading-7 text-slate-600">
            No additional identifying details provided.
          </p>
        )}
      </div>
    </section>
  );
}
