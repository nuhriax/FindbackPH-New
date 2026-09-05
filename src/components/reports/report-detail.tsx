import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Lock,
  MapPin,
  PackageCheck,
  ScanSearch,
} from "lucide-react";

import { ShareButton } from "@/components/share-button";
import { Logo } from "@/components/logo";
import { MessageButton } from "@/components/message-button";
import { SaveButton } from "@/components/save-button";
import { ReportFlagButton } from "@/components/report-flag-button";
import { UserReportButton } from "@/components/user-report-button";
import { ViewCounter } from "@/components/view-counter";
import {
  ReportViewers,
  type ReportViewer,
} from "@/components/reports/report-viewers";
import { OwnershipVerifiedBadge } from "@/components/ui/verification-badge";
import { OwnershipChallengeManager } from "@/components/reports/ownership-challenge-manager";
import { OwnershipChallengeForm } from "@/components/reports/ownership-challenge-form";
import {
  ReturnConfirmationCard,
  type ReturnConfirmState,
} from "@/components/reports/return-confirmation";
import { ReportOwnerActions } from "@/components/reports/report-owner-actions";
import { ReportEditToggle } from "@/components/reports/report-edit-toggle";

import { categoryLabelOf } from "./detail/match-helpers";
import { GalleryCard } from "./detail/gallery-panel";
import { ReporterCard } from "./detail/reporter-card";
import { PossibleMatches } from "./detail/possible-matches";
import { SimilarReports } from "./detail/similar-reports";

import type {
  DetailItem,
  DetailMatch,
  DetailTrustSignals,
  ReporterSummary,
  SimilarItem,
} from "./report-detail-types";

export type { DetailItem, DetailMatch, SimilarItem };

/* ============================================================
   REPORT DETAIL — SPLIT-PANEL ITEM PROFILE
   ------------------------------------------------------------
   ONE large horizontal item window:
     LEFT  (~40%) — visual item panel (photo identity)
     RIGHT (~60%) — information + action panel
   The whole composition targets one desktop viewport.
   Hierarchy: image → status → title → location/date/reward →
   details → reporter → safety → primary CTA → meta.
   ============================================================ */

export function ReportDetail({
  kind,
  item,
  images,
  reporter,
  trust,
  ownership,
  isOwner,
  savedItemId,
  matches,
  similarItems = [],
  viewers,
  returnConfirm,
  backHref = "/search",
  backLabel = "Back to search",
  matchHref,
}: {
  kind: "lost" | "found";
  item: DetailItem;
  images: { id: string; url: string }[];
  reporter: ReporterSummary | null;

  /** Real trust signals. Omit to render no trust badges. */
  trust?: DetailTrustSignals;

  /** Ownership verification challenge state. */
  ownership?: {
    itemType: "lost_item" | "found_item";
    itemId: string;
    questions: {
      question1: string;
      question2: string | null;
    } | null;
    viewerPassed: boolean;
  } | null;

  isOwner: boolean;
  savedItemId: string | null;
  matches: DetailMatch[];

  /** Other active reports with the same category. */
  similarItems?: SimilarItem[];

  /** Owner-only report viewers. */
  viewers?: ReportViewer[] | null;

  /** Two-sided return confirmation state (Trust & Safety 110). */
  returnConfirm?: ReturnConfirmState | null;

  backHref?: string;
  backLabel?: string;

  matchHref?: (id: string) => string;
}) {
  const isLost = kind === "lost";

  const itemType: "lost_item" | "found_item" = isLost
    ? "lost_item"
    : "found_item";

  const categoryLabel = categoryLabelOf(item.category);

  /* ---------------- LOCATION ---------------- */

  const location =
    item.approximateLocation ||
    [item.city, item.province].filter(Boolean).join(", ") ||
    "Location not set";

  const cityProvince =
    [item.city, item.province].filter(Boolean).join(", ") || null;

  /* ---------------- DATES ---------------- */

  const reportDate = item.createdAt
    ? format(new Date(item.createdAt), "MMM d, yyyy")
    : "Recently";

  const occurredIso = item.dateOccurred ?? item.createdAt ?? null;

  const occurredDate = occurredIso
    ? format(new Date(occurredIso), "MMM d, yyyy")
    : item.dateLabel;

  /* ---------------- LEDE ---------------- */

  const lede = isLost
    ? "This item was reported missing. Review the details carefully if you believe you have seen or found it."
    : "This item was reported as found. Review the details carefully before contacting the finder.";

  /* ---------------- REPORTER ---------------- */

  const reporterNameParts = (
    reporter
      ? [reporter.first_name ?? "", reporter.last_name ?? ""]
          .map((part: string) => part.trim())
          .filter(Boolean)
      : []
  ).filter(
    (part: string, index: number, parts: string[]) =>
      parts.indexOf(part) === index,
  );

  const reporterName =
    reporterNameParts.join(" ") ||
    reporter?.username ||
    "FindBack user";

  const firstLetter = (
    reporter?.first_name?.[0] ??
    reporter?.username?.[0] ??
    (isLost ? "R" : "F")
  ).toUpperCase();

  /* ---------------- IDENTIFYING DETAILS ---------------- */

  const featureItems = (item.distinguishingFeatures ?? "")
    .split(/\r?\n|•|,/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Fail-closed: identifying details are locked for EVERY non-owner until they
  // pass the reporter's ownership challenge. Even when no challenge exists,
  // the private details are not shown publicly — claimants verify via message.
  const detailsLocked = Boolean(!isOwner && !ownership?.viewerPassed);

  /* ---------------- STATUS STEPPER ---------------- */

  const steps = [
    { label: isLost ? "Lost" : "Found", done: true },
    { label: "Posted", done: true },
    { label: "Matching", done: matches.length > 0 },
    { label: "Returned", done: item.status === "recovered" },
  ];

  /* The furthest completed step is the report's current state. */
  const currentStepIdx = steps.reduce(
    (last, s, i) => (s.done ? i : last),
    0,
  );

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* BACKGROUND ATMOSPHERE — extremely subtle; the item window
          is the focal point. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_180px)]"
      >
        <div
          className="
            absolute
            left-1/2
            top-[-240px]
            h-[480px]
            w-[760px]
            -translate-x-1/2
            rounded-full
            bg-gradient-to-r
            from-electric-300/15
            via-cyan-200/20
            to-emerald-200/15
            blur-3xl
          "
        />

        <div
          className="
            absolute left-[8%] top-[160px] h-36 w-36 rounded-full bg-electric-200/10 blur-3xl
          "
        />

        <div
          className="
            absolute right-[5%] top-[200px] h-44 w-44 rounded-full bg-emerald-200/10 blur-3xl
          "
        />
      </div>

      <div className="mx-auto w-full max-w-[1280px] px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        {/* COMPACT UTILITY ROW — back · share */}
        <div className="mb-3 flex items-center justify-between gap-4">
          <Link
            href={backHref}
            className="
              group inline-flex min-h-9 items-center gap-2 rounded-full px-2
              text-sm font-semibold text-slate-500 transition-colors
              hover:text-slate-900 focus:outline-none focus:ring-2
              focus:ring-electric-400/40
            "
          >
            <ArrowLeft
              size={15}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />

            <span>{backLabel}</span>
          </Link>

          <ShareButton title={item.title} />
        </div>

        {/* COMPACT STATUS INDICATOR — tiny horizontal stepper */}
        <ol
          aria-label="Report status"
          className="mb-3 flex max-w-lg items-center"
        >
          {steps.map((step, i) => (
            <li
              key={step.label}
              className="flex min-w-0 flex-1 items-center last:flex-none"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    step.done
                      ? i === currentStepIdx
                        ? "bg-electric-500 text-white shadow-sm ring-2 ring-electric-500/30"
                        : "bg-electric-500 text-white shadow-sm"
                      : "border-2 border-slate-400/70 bg-transparent"
                  }`}
                >
                  {step.done && <Check size={11} strokeWidth={3.5} />}
                </span>

                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
                    i === currentStepIdx
                      ? "text-slate-900"
                      : step.done
                        ? "text-slate-500"
                        : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className={`mx-2.5 h-px flex-1 rounded-full ${
                    step.done ? "bg-electric-300" : "bg-slate-200"
                  }`}
                />
              )}
            </li>
          ))}
        </ol>

        {/* ======================================================
            MAIN ITEM WINDOW — one cohesive object
            ====================================================== */}

        <div
          className="
            item-detail-enter
            max-lg:overflow-visible
            overflow-hidden
            rounded-[28px]
            border
            border-slate-200/70
            bg-white
            shadow-[0_28px_80px_-32px_rgba(15,23,42,0.30)]
            lg:grid
            lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]
            lg:items-stretch
          "
        >
          {/* LEFT PANEL — ITEM IMAGE (visual identity) */}
          <div className="relative min-w-0 border-b border-slate-200/70 lg:h-auto lg:min-h-[560px] lg:border-b-0 lg:border-r">
            <GalleryCard
              kind={kind}
              itemId={item.id}
              itemTitle={item.title}
              itemStatus={item.status === "recovered" ? "recovered" : "active"}
              reportId={item.id}
              images={images}
              isOwner={isOwner}
            />
          </div>

          {/* RIGHT PANEL — INFORMATION + ACTION */}
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-col gap-4 px-5 py-5 sm:px-8 sm:py-6">
              {/* Meta line — quiet, no boxes: status · category · views */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <span
                  className={`inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] ${
                    isLost ? "status-label-lost text-amber-600" : "text-emerald-600"
                  }`}
                >
                  <span
                    className={`relative flex h-1.5 w-1.5 rounded-full ${
                      isLost ? "text-amber-500" : "text-emerald-500"
                    }`}
                  >
                    <span
                      className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
                        isLost ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                    />

                    <span
                      className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                        isLost ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                    />
                  </span>

                  {isLost ? "Lost item" : "Found item"}
                </span>

                <span aria-hidden className="h-1 w-1 rounded-full bg-slate-300" />

                <span className="text-xs font-medium text-slate-500">
                  {categoryLabel}
                </span>

                {item.viewCount != null && (
                  <>
                    <span aria-hidden className="h-1 w-1 rounded-full bg-slate-300" />

                    <ViewCounter
                      itemType={itemType}
                      itemId={item.id}
                      initialCount={item.viewCount}
                    />
                  </>
                )}
              </div>

              {/* Title — strongest heading on the page (Sora) */}
              <h1 className="font-display text-balance text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-slate-900 sm:text-[34px]">
                {item.title}
              </h1>

              <p className="-mt-1.5 max-w-xl text-pretty text-[13.5px] leading-6 text-slate-500">
                {lede}
              </p>

              {/* KEY INFORMATION STRIP — location · date · reward.
                  One unified component with vertical dividers. */}
              <div className="grid grid-cols-3 divide-x divide-slate-200/70 rounded-2xl bg-slate-50/80 py-3 ring-1 ring-inset ring-slate-200/50">
                <div className="min-w-0 pl-3 pr-2 sm:pl-4 sm:pr-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    <MapPin size={11} aria-hidden="true" />
                    Location
                  </p>

                  <p
                    className="mt-1 truncate text-[15px] font-bold leading-6 text-slate-900"
                    title={location}
                  >
                    {location}
                  </p>

                  <p className="mt-0.5 truncate text-[11px] leading-4 text-slate-500">
                    {cityProvince ?? "Not specified"}
                  </p>
                </div>

                <div className="min-w-0 px-3 sm:px-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {isLost ? "Lost date" : "Found date"}
                  </p>

                  <p className="mt-1 text-[15px] font-bold leading-6 text-slate-900">
                    {occurredDate}
                  </p>

                  <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                    Posted {reportDate}
                  </p>
                </div>

                <div className="min-w-0 pl-3 pr-2 sm:pl-4 sm:pr-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {isLost ? "Reward" : "Held at"}
                  </p>

                  {isLost ? (
                    <p
                      className={`mt-1 text-[15px] font-extrabold leading-6 tracking-[-0.01em] ${
                        item.reward !== null
                          ? "text-emerald-700"
                          : "text-slate-400"
                      }`}
                    >
                      {item.reward !== null
                        ? `₱${item.reward.toLocaleString()}`
                        : "—"}
                    </p>
                  ) : (
                    <p className="mt-1 truncate text-[15px] font-bold leading-6 text-slate-900">
                      {item.holdingInfo || "With finder"}
                    </p>
                  )}

                  <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                    {isLost ? "Recovery incentive" : "Safekeeping"}
                  </p>
                </div>
              </div>

              {/* DETAILS — two tinted cards, one per topic. */}
              <div className="grid gap-4 sm:grid-cols-2">
                <section
                  aria-label="About this item"
                  className="rounded-2xl border border-slate-200/10 bg-slate-400/5 px-4 py-3.5"
                >
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    About this item
                  </h2>

                  <p className="mt-2 whitespace-pre-line text-pretty text-[15px] leading-6 text-slate-700">
                    {item.description ||
                      (isLost
                        ? `Lost in ${cityProvince ?? "an area not specified"}.`
                        : "No description provided.")}
                  </p>
                </section>

                <section
                  aria-label="Identifying details"
                  className="min-w-0 rounded-2xl border border-slate-200/10 bg-slate-400/5 px-4 py-3.5"
                >
                  <h2 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    <ScanSearch size={12} aria-hidden="true" />
                    Identifying details
                  </h2>

                  {detailsLocked ? (
                    <div className="mt-2 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3.5">
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200/70 text-slate-500">
                          <Lock size={13} />
                        </span>

                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-slate-900">
                            Private verification
                          </p>

                          <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                            Some details are hidden to help verify the rightful
                            owner.
                          </p>

                          {ownership?.questions ? (
                            <Link
                              href="#ownership-verify"
                              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-electric-700 hover:underline"
                            >
                              Answer questions to unlock
                            </Link>
                          ) : (
                            <p className="mt-2 text-xs font-semibold text-slate-400">
                              Use &ldquo;Prove It&apos;s Yours&rdquo; to verify
                              with the reporter.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {featureItems.length > 0 ? (
                        <ul className="mt-2 space-y-1.5">
                          {featureItems.map((feature, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-[15px] leading-6 text-slate-700"
                            >
                              <span
                                aria-hidden
                                className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-electric-400"
                              />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-[15px] leading-6 text-slate-500">
                          No additional identifying details provided.
                        </p>
                      )}

                      <p className="mt-2.5 text-[12px] leading-4 text-slate-500">
                        Verification questions stay private between the owner
                        and claimants.
                      </p>
                    </>
                  )}
                </section>
              </div>

              {/* REPORTED BY — one horizontal bar: identity left, trust
                  pills inline, returns counter right. */}
              <section
                aria-label={isLost ? "Reported by" : "Found by"}
                className="mt-2 min-w-0 border-t border-slate-200/60 pt-4"
              >
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {isLost ? "Reported by" : "Found by"}
                </p>

                <ReporterCard
                  isLost={isLost}
                  item={item}
                  reporter={reporter}
                  trust={trust ?? null}
                  reporterName={reporterName}
                  firstLetter={firstLetter}
                />
              </section>
            </div>

            {/* PRIMARY ACTION AREA — strongest on mobile: sticky at the
                bottom of the viewport while scrolling the details. */}
            <div
              className="
                mt-auto
                border-t
                border-slate-200/70
                bg-white
                px-5
                pb-3.5
                pt-3.5
                sm:px-8
                max-lg:sticky
                max-lg:bottom-0
                max-lg:z-30
                max-lg:rounded-b-[28px]
                max-lg:shadow-[0_-10px_30px_-18px_rgba(15,23,42,0.25)]
              "
            >
              {!isOwner ? (
                <div className="space-y-2">
                  <div
                    className="
                      [&>div>button]:h-12
                      [&>div>button]:text-[15px]
                      [&>div>button]:font-bold
                      [&>div>button]:shadow-glow
                      [&>div>button]:transition-all
                      [&>div>button]:focus-visible:outline-none
                      [&>div>button]:focus-visible:ring-2
                      [&>div>button]:focus-visible:ring-electric-400
                      [&>div>button]:focus-visible:ring-offset-2
                      [&>div>button]:active:translate-y-px
                      [&>div>button:disabled]:cursor-wait
                      [&>div>button:disabled]:opacity-70
                    "
                  >
                    <MessageButton
                      itemType={itemType}
                      itemId={item.id}
                      label={isLost ? "Message Owner" : "Message Finder"}
                    />
                  </div>

                  {/* Secondary actions — one row, clearly below the CTA */}
                  {isLost ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/report/found"
                        className="
                          inline-flex
                          min-h-11
                          w-full
                          items-center
                          justify-center
                          gap-1.5
                          rounded-xl
                          border
                          border-electric-300/70
                          bg-electric-50
                          px-3
                          text-sm
                          font-semibold
                          text-electric-800
                          transition-colors
                          hover:border-electric-500/50
                          hover:bg-electric-100
                          focus-visible:outline-none
                          focus-visible:ring-2
                          focus-visible:ring-electric-400
                          focus-visible:ring-offset-2
                          active:translate-y-px
                        "
                      >
                        <PackageCheck size={15} aria-hidden="true" />
                        Report a found item
                      </Link>

                      <SaveButton
                        lostItemId={item.id}
                        savedItemId={savedItemId}
                        isOwner={isOwner}
                      />
                    </div>
                  ) : (
                    <SaveButton
                      foundItemId={item.id}
                      savedItemId={savedItemId}
                      isOwner={isOwner}
                    />
                  )}
                </div>
              ) : item.status !== "recovered" ? (
                <ReportEditToggle
                  kind={itemType}
                  images={images}
                  item={{
                    id: item.id,
                    title: item.title,
                    category: item.category,
                    description: item.description ?? "",
                    distinguishingFeatures: item.distinguishingFeatures,
                    city: item.city ?? "",
                    province: item.province ?? "",
                    approximateLocation: item.approximateLocation,
                    dateString: item.dateOccurred
                      ? String(item.dateOccurred).slice(0, 10)
                      : "",
                    reward: isLost ? item.reward : null,
                    holdingInfo: isLost ? null : item.holdingInfo ?? null,
                  }}
                >
                  <ReportOwnerActions
                    itemType={itemType}
                    itemId={item.id}
                    status={item.status as any}
                  />
                </ReportEditToggle>
              ) : (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3.5 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 size={17} />
                  This report has been recovered
                </div>
              )}

              {/* FOOTER META — intentionally small */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                <div className="flex items-center gap-2 text-[10.5px] font-medium text-slate-400">
                  <span>Posted {reportDate}</span>

                  <span aria-hidden className="h-1 w-1 rounded-full bg-slate-300" />

                  <span className="font-mono tracking-tight" title={`Report ID: ${item.id}`}>
                    ID {item.id.slice(0, 8)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <ReportFlagButton itemType={itemType} itemId={item.id} />

                  {item.reporterId && (
                    <UserReportButton targetUserId={item.reporterId} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================
            OWNERSHIP VERIFICATION — visitor challenge form
            (target of the #ownership-verify anchors above)
            ====================================================== */}

        {ownership && !isOwner && ownership.questions && (
          <section
            id="ownership-verify"
            className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-soft"
          >
            <div className="px-5 py-5 sm:px-7">
              {ownership.viewerPassed ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <OwnershipVerifiedBadge />

                  <p className="mt-2 text-xs leading-5 text-emerald-800/80">
                    You successfully verified your ownership using the
                    reporter&apos;s private questions.
                  </p>
                </div>
              ) : (
                <>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-electric-600">
                    Verify it&apos;s yours
                  </p>

                  <OwnershipChallengeForm
                    itemType={ownership.itemType}
                    itemId={ownership.itemId}
                    question1={ownership.questions.question1}
                    question2={ownership.questions.question2}
                    hasSecondQuestion={Boolean(
                      ownership.questions.question2,
                    )}
                  />
                </>
              )}
            </div>
          </section>
        )}

        {/* Two-sided return confirmation (Trust & Safety 110) */}
        {returnConfirm?.canConfirm && (
          <ReturnConfirmationCard
            itemType={itemType}
            itemId={item.id}
            state={returnConfirm}
          />
        )}

        {/* Owner protection — challenge manager */}
        {ownership && isOwner && (
          <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-soft">
            <div className="px-5 py-5 sm:px-7">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                Owner protection
              </p>

              <OwnershipChallengeManager
                itemType={ownership.itemType}
                itemId={ownership.itemId}
                initialQuestion1={ownership.questions?.question1 ?? ""}
                initialQuestion2={ownership.questions?.question2 ?? ""}
              />
            </div>
          </section>
        )}

        {/* Owner-only viewers */}
        {isOwner && viewers && (
          <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-soft">
            <div className="px-5 py-5 sm:px-7">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Activity
              </p>

              <ReportViewers viewers={viewers} />
            </div>
          </section>
        )}

        {/* POSSIBLE MATCHES */}
        {matches.length > 0 && (
          <section
            aria-label="Possible matches"
            className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-soft"
          >
            <div className="px-5 py-6 sm:px-7">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-electric-600">
                    Smart matching
                  </p>

                  <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">
                    Possible matches
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Based on the information provided, these appear to be
                    possible matches — not final proof of ownership.
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {matches.length}
                </span>
              </div>

              <PossibleMatches matches={matches} matchHref={matchHref} />
            </div>
          </section>
        )}

        {/* SIMILAR REPORTS */}
        <section className="mt-8">
          <SimilarReports
            categoryLabel={categoryLabel}
            province={item.province}
            similarItems={similarItems}
          />
        </section>

        {/* PAGE FOOTER — brand + safety reminder */}
        <div className="mt-8 flex flex-col items-center justify-center gap-2.5 text-center">
          <Logo />

          <p className="max-w-md text-[11px] leading-5 text-slate-400">
            Never share sensitive information publicly. Verify ownership before
            handing over or paying any reward.
          </p>
        </div>
      </div>
    </main>
  );
}






