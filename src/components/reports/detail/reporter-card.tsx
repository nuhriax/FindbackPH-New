import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2 } from "lucide-react";

import {
  TrustedMemberBadge,
  VerifiedReportBadge,
} from "@/components/ui/verification-badge";
import type {
  DetailItem,
  DetailTrustSignals,
  ReporterSummary,
} from "../report-detail-types";

/* ============================================================
   REPORTER CARD — identity, returns counter, trust badges
============================================================ */

export function ReporterCard({
  isLost,
  item,
  reporter,
  trust,
  reporterName,
  firstLetter,
}: {
  isLost: boolean;
  item: DetailItem;
  reporter: ReporterSummary | null;
  trust: DetailTrustSignals;
  reporterName: string;
  firstLetter: string;
}) {
  return (
    <section
      className="
        relative min-w-0 overflow-hidden rounded-2xl border
        border-slate-200/10 bg-slate-400/5 px-4 py-3.5
      "
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        {/* Identity — larger avatar, name + handle, stats underneath */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-full
                bg-gradient-to-br
                from-emerald-400
                to-emerald-600
                text-[15px]
                font-bold
                text-white
                ring-2
                ring-white
                shadow-sm
              "
            >
              {item.reporterId ? (
                <Link href={`/member/${item.reporterId}`} title="View member profile">
                  {firstLetter}
                </Link>
              ) : (
                firstLetter
              )}
            </div>

            {/* Verified seal on the avatar's edge — trust visible
                at a glance. */}
            {trust?.emailVerified && (
              <span
                title="Verified account"
                className="
                  absolute
                  -bottom-0.5
                  -right-0.5
                  flex
                  h-[18px]
                  w-[18px]
                  items-center
                  justify-center
                  rounded-full
                  bg-blue-500
                  text-white
                  ring-2
                  ring-white
                  shadow-sm
                "
              >
                <CheckCircle2 size={11} />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {item.reporterId ? (
                <Link
                  href={`/member/${item.reporterId}`}
                  className="group flex items-center gap-1 truncate text-[16px] font-bold text-slate-900 transition-colors hover:text-electric-700 hover:underline"
                  title={reporterName}
                >
                  <span className="truncate">{reporterName}</span>

                  <ArrowUpRight
                    size={13}
                    className="shrink-0 text-slate-400 transition-all group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-electric-700"
                  />
                </Link>
              ) : (
                <p className="truncate text-[16px] font-bold text-slate-900">
                  {reporterName}
                </p>
              )}

              {/* Strongest earned signal sits with the name */}
              {trust?.verifiedReport && <VerifiedReportBadge />}
            </div>

            <p className="mt-0.5 truncate text-[11.5px] text-slate-500">
              <span
                className={
                  (reporter?.successful_returns ?? 0) > 0
                    ? "font-semibold text-emerald-600"
                    : undefined
                }
              >
                {(reporter?.successful_returns ?? 0) > 0
                  ? `${reporter?.successful_returns} successful return${(reporter?.successful_returns ?? 0) === 1 ? "" : "s"}`
                  : "Community member"}
              </span>
            </p>
          </div>
        </div>

        {/* Trusted-member badge + profile arrow — right side */}
        <div className="ml-auto flex items-center gap-2.5">
          {trust?.trustedMember && <TrustedMemberBadge />}

          {item.reporterId && (
            <Link
              href={`/member/${item.reporterId}`}
              className="
                inline-flex items-center gap-1 rounded-full border
                border-slate-200/60 bg-white/60 px-3 py-1.5 text-[11px]
                font-bold text-slate-600 transition-colors
                hover:border-electric-300 hover:text-electric-700
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-electric-400
              "
            >
              View profile
              <ArrowRight size={12} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
