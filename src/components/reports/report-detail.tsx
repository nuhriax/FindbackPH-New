import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Calendar,
  CheckCircle2,
  Eye,
  Flag,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Tag,
  UserRound,
} from "lucide-react";

import { CATEGORY_LABELS } from "@/lib/validation";
import { ImageGallery } from "@/components/image-gallery";
import { MessageButton } from "@/components/message-button";
import { SaveButton } from "@/components/save-button";
import { ShareButton } from "@/components/share-button";
import { ReportFlagButton } from "@/components/report-flag-button";
import { ReportOwnerActions } from "@/components/reports/report-owner-actions";
import { ReportEditToggle } from "@/components/reports/report-edit-toggle";

export type DetailItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  distinguishingFeatures: string | null;
  city: string | null;
  province: string | null;
  approximateLocation: string | null;
  status: string;
  createdAt: string | null;
  dateLabel: string;
  reward: number | null;
  /** Raw date (YYYY-MM-DD…) used to prefill the inline edit form. */
  dateOccurred?: string | null;
  /** Found items only — where the item is currently being kept. */
  holdingInfo?: string | null;
};

export type DetailMatch = {
  id: string;
  kind: "lost" | "found";
  title: string;
  category: string;
  city: string | null;
  province: string | null;
  score: number | null;
};

/* ============================================================
   MATCH INFO
============================================================ */

function getMatchInfo(score: number | null) {
  if (score == null) {
    return {
      label: "Possible",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (score >= 0.75) {
    return {
      label: "Strong",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (score >= 0.6) {
    return {
      label: "Possible",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Low",
    className:
      "border-slate-200 bg-slate-100 text-slate-600",
  };
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  kind,
  status,
}: {
  kind: "lost" | "found";
  status: string;
}) {
  const isLost = kind === "lost";

  const active =
    status === "active" ||
    status === "matched";

  let label: string;

  if (status === "recovered") {
    label = "Recovered";
  } else if (status === "matched") {
    label = "Matched";
  } else if (isLost) {
    label = active
      ? "Still missing"
      : "Not active";
  } else {
    label = active
      ? "Awaiting owner"
      : "Not active";
  }

  const dotColor = isLost
    ? active
      ? "bg-red-500"
      : "bg-slate-400"
    : active
      ? "bg-emerald-500"
      : "bg-slate-400";

  const textColor = isLost
    ? active
      ? "text-red-700"
      : "text-slate-500"
    : active
      ? "text-emerald-700"
      : "text-slate-500";

  return (
    <span
      className="
        inline-flex
        items-center
        gap-2
        rounded-full
        border
        border-white/80
        bg-white/95
        px-4
        py-2
        text-xs
        font-semibold
        shadow-sm
        backdrop-blur
      "
    >
      <span
        className={`h-2 w-2 rounded-full ${dotColor}`}
      />

      <span className={textColor}>
        {label}
      </span>
    </span>
  );
}

/* ============================================================
   REPORT DETAIL
============================================================ */

export function ReportDetail({
  kind,
  item,
  images,
  reporter,
  isOwner,
  savedItemId,
  matches,
  backHref = "/search",
  backLabel = "Back to search",
  matchHref,
}: {
  kind: "lost" | "found";
  item: DetailItem;
  images: { id: string; url: string }[];
  reporter: {
    username: string;
    successful_returns: number;
  } | null;
  isOwner: boolean;
  savedItemId: string | null;
  matches: DetailMatch[];
  backHref?: string;
  backLabel?: string;
  matchHref?: (id: string) => string;
}) {
  const isLost = kind === "lost";

  const itemType =
    isLost
      ? "lost_item"
      : "found_item";

  const categoryLabel =
    CATEGORY_LABELS[
      item.category as keyof typeof CATEGORY_LABELS
    ] ?? item.category;

  const location =
    item.approximateLocation ||
    [item.city, item.province]
      .filter(Boolean)
      .join(", ") ||
    "Location not set";

  const typeText =
    isLost
      ? "Lost item"
      : "Found item";

  const typeColor =
    isLost
      ? "text-red-700"
      : "text-emerald-700";

  const typeDot =
    isLost
      ? "bg-red-500"
      : "bg-emerald-500";

  const reportDate = item.createdAt
    ? format(
        new Date(item.createdAt),
        "MMM d, yyyy",
      )
    : "Recently";

  const firstLetter = (
    reporter?.username?.[0] ??
    (isLost ? "R" : "F")
  ).toUpperCase();

  return (
    <main
      className="
        mx-auto
        w-full
        max-w-[1380px]
        px-4
        py-5
        sm:px-6
        lg:px-8
      "
    >
      {/* ======================================================
          PAGE NAVIGATION
      ======================================================= */}

      <div className="mb-5 flex items-center justify-between">
        <Link
          href={backHref}
          className="
            group
            inline-flex
            items-center
            gap-2
            rounded-xl
            px-2
            py-2
            text-sm
            font-medium
            text-slate-600
            transition-all
            hover:bg-white/70
            hover:text-blue-700
          "
        >
          <ArrowLeft
            size={17}
            className="
              transition-transform
              duration-200
              group-hover:-translate-x-0.5
            "
          />

          {backLabel}
        </Link>

        <ShareButton title={item.title} />
      </div>

      {/* ======================================================
          SINGLE REPORT SURFACE
      ======================================================= */}

      <section
        className="
          overflow-hidden
          rounded-[32px]
          border
          border-white/80
          bg-white/90
          shadow-[0_30px_90px_-45px_rgba(15,23,42,0.38)]
          backdrop-blur-xl
        "
      >
        <div
          className="
            grid
            items-stretch
            lg:grid-cols-[0.78fr_1.22fr]
          "
        >
          {/* ==================================================
              IMAGE PANEL
          =================================================== */}

          <div
            className="
              relative
              hidden
              min-h-[620px]
              bg-slate-100/45
              lg:block
            "
          >
            <div
              className="
                pointer-events-none
                absolute
                inset-0
                bg-gradient-to-br
                from-slate-100
                via-transparent
                to-blue-50/70
              "
            />

            {/* Status */}

            <div className="absolute left-6 top-6 z-20">
              <StatusBadge
                kind={kind}
                status={item.status}
              />
            </div>

            {/* Gallery */}

            <div className="absolute inset-6 flex flex-col">
              {/* Framed main photo — stretches to fill the panel height.
                  Transparent bg so the panel's ambient gradient (the site's
                  real background) shows behind the letterboxed photo. */}
              <div
                className="
                  relative
                  min-h-[420px]
                  flex-1
                  overflow-hidden
                  rounded-[28px]
                  border
                  border-white/80
                  shadow-[0_24px_55px_-30px_rgba(15,23,42,0.4)]
                "
              >
                {images.length > 0 ? (
                  <ImageGallery
                    images={images}
                    alt={item.title}
                    addMoreHref={
                      isOwner ? `/dashboard/reports/${item.id}/edit` : undefined
                    }
                    fill
                  />
                ) : (
                  <div
                    className="
                      flex
                      h-full
                      min-h-[560px]
                      items-center
                      justify-center
                      bg-slate-50
                    "
                  >
                    <div className="text-center">
                      <div
                        className="
                          mx-auto
                          flex
                          h-16
                          w-16
                          items-center
                          justify-center
                          rounded-2xl
                          bg-white
                          text-slate-500
                          shadow-sm
                        "
                      >
                        <Eye size={26} />
                      </div>

                      <p
                        className="
                          mt-5
                          text-sm
                          font-semibold
                          text-slate-600
                        "
                      >
                        No photos available
                      </p>

                      <p
                        className="
                          mt-1.5
                          text-xs
                          text-slate-400
                        "
                      >
                        Review the written details carefully.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Photo count + report reference, aligned under the frame */}
              <div className="mt-3 flex shrink-0 items-center justify-between">
                <span
                  className="
                    rounded-full
                    border
                    border-white/80
                    bg-white/95
                    px-3.5
                    py-2
                    text-xs
                    font-medium
                    text-slate-600
                    shadow-sm
                    backdrop-blur
                  "
                >
                  {images.length}{" "}
                  {images.length === 1 ? "photo" : "photos"}
                </span>

                <span
                  className="
                    rounded-full
                    border
                    border-white/80
                    bg-white/95
                    px-3.5
                    py-2
                    font-mono
                    text-xs
                    text-slate-500
                    shadow-sm
                    backdrop-blur
                  "
                >
                  #{item.id.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>

          {/* ==================================================
              INFORMATION PANEL
          =================================================== */}

          <div className="min-w-0">
            <div className="p-7 sm:p-8 lg:p-9">
              {/* Mobile gallery — the desktop image panel is lg-only */}
              <div className="mb-6 lg:hidden">
                <ImageGallery
                  images={images}
                  alt={item.title}
                  addMoreHref={
                    isOwner ? `/dashboard/reports/${item.id}/edit` : undefined
                  }
                />
              </div>

              {/* Mobile status */}

              <div className="mb-5 lg:hidden">
                <StatusBadge
                  kind={kind}
                  status={item.status}
                />
              </div>

              {/* Type */}

              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={`
                    inline-flex
                    items-center
                    gap-2
                    text-sm
                    font-bold
                    ${typeColor}
                  `}
                >
                  <span
                    className={`
                      h-2
                      w-2
                      rounded-full
                      ${typeDot}
                    `}
                  />

                  {typeText}
                </span>

                <span className="text-slate-300">
                  •
                </span>

                <span
                  className="
                    inline-flex
                    items-center
                    gap-2
                    text-sm
                    font-medium
                    text-slate-500
                  "
                >
                  <Tag size={14} />

                  {categoryLabel}
                </span>
              </div>

              {/* Title */}

              <h1
                className="
                  mt-4
                  max-w-3xl
                  font-display
                  text-[38px]
                  font-semibold
                  leading-[1.05]
                  tracking-[-0.035em]
                  text-slate-950
                  sm:text-[46px]
                "
              >
                {item.title}
              </h1>

              {/* Supporting text */}

              <p
                className="
                  mt-4
                  max-w-2xl
                  text-sm
                  leading-6
                  text-slate-600
                "
              >
                {isLost
                  ? "This item was reported missing. Review the details carefully if you believe you have seen or found it."
                  : "This item was reported as found. Review the details carefully before contacting the finder."}
              </p>

              {/* =================================================
                  FACTS
              ================================================== */}

              <div
                className={`
                  mt-6
                  grid
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200/80
                  bg-slate-50/60

                  ${
                    item.reward !== null
                      ? "grid-cols-3"
                      : "grid-cols-2"
                  }
                `}
              >
                {/* Location */}

                <div className="min-w-0 p-5">
                  <div className="flex items-center gap-2.5">
                    <MapPin
                      size={16}
                      className="shrink-0 text-blue-600"
                    />

                    <span
                      className="
                        text-[11px]
                        font-bold
                        uppercase
                        tracking-[0.12em]
                        text-slate-500
                      "
                    >
                      Location
                    </span>
                  </div>

                  <p
                    className="
                      mt-2.5
                      truncate
                      text-sm
                      font-semibold
                      text-slate-900
                    "
                  >
                    {location}
                  </p>
                </div>

                {/* Date */}

                <div
                  className="
                    min-w-0
                    border-l
                    border-slate-200/80
                    p-5
                  "
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar
                      size={16}
                      className="shrink-0 text-slate-500"
                    />

                    <span
                      className="
                        text-[11px]
                        font-bold
                        uppercase
                        tracking-[0.12em]
                        text-slate-500
                      "
                    >
                      {isLost
                        ? "Lost date"
                        : "Found date"}
                    </span>
                  </div>

                  <p
                    className="
                      mt-2.5
                      truncate
                      text-sm
                      font-semibold
                      text-slate-900
                    "
                  >
                    {item.dateLabel ||
                      "Not provided"}
                  </p>
                </div>

                {/* Reward */}

                {item.reward !== null && (
                  <div
                    className="
                      min-w-0
                      border-l
                      border-slate-200/80
                      p-5
                    "
                  >
                    <div className="flex items-center gap-2.5">
                      <Banknote
                        size={16}
                        className="shrink-0 text-emerald-600"
                      />

                      <span
                        className="
                          text-[11px]
                          font-bold
                          uppercase
                          tracking-[0.12em]
                          text-slate-500
                        "
                      >
                        Reward
                      </span>
                    </div>

                    <p
                      className="
                        mt-2.5
                        truncate
                        text-sm
                        font-bold
                        text-emerald-700
                      "
                    >
                      ₱{item.reward.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* =================================================
                  ABOUT + IDENTIFYING DETAILS
              ================================================== */}

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {/* About */}

                <section className="min-w-0">
                  <p
                    className="
                      text-[11px]
                      font-bold
                      uppercase
                      tracking-[0.14em]
                      text-blue-600
                    "
                  >
                    About this item
                  </p>

                  <p
                    className="
                      mt-2.5
                      whitespace-pre-line
                      text-sm
                      leading-6
                      text-slate-600
                    "
                  >
                    {item.description ||
                      "No description provided."}
                  </p>
                </section>

                {/* Identifying details */}

                <section
                  className="
                    min-w-0
                    border-l
                    border-slate-200/80
                    pl-6
                  "
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles
                      size={15}
                      className="text-amber-500"
                    />

                    <p
                      className="
                        text-[11px]
                        font-bold
                        uppercase
                        tracking-[0.14em]
                        text-slate-500
                      "
                    >
                      Identifying details
                    </p>
                  </div>

                  <p
                    className="
                      mt-2.5
                      whitespace-pre-line
                      text-sm
                      leading-6
                      text-slate-600
                    "
                  >
                    {item.distinguishingFeatures ||
                      "No additional identifying details provided."}
                  </p>
                </section>
              </div>

              {/* =================================================
                  FINDER + SAFETY
              ================================================== */}

              <div
                className="
                  mt-6
                  grid
                  gap-6
                  border-t
                  border-slate-200/80
                  pt-6
                  sm:grid-cols-2
                "
              >
                {/* Finder */}

                <section className="min-w-0">
                  <p
                    className="
                      text-[11px]
                      font-bold
                      uppercase
                      tracking-[0.14em]
                      text-slate-500
                    "
                  >
                    {isLost
                      ? "Reported by"
                      : "Finder"}
                  </p>

                  <div
                    className="
                      mt-3
                      flex
                      items-center
                      justify-between
                      gap-4
                    "
                  >
                    <div
                      className="
                        flex
                        min-w-0
                        items-center
                        gap-3
                      "
                    >
                      <div
                        className="
                          flex
                          h-11
                          w-11
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-blue-50
                          text-sm
                          font-bold
                          text-blue-700
                          ring-4
                          ring-blue-50/50
                        "
                      >
                        {firstLetter}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <UserRound
                            size={13}
                            className="shrink-0 text-slate-400"
                          />

                          <p
                            className="
                              truncate
                              text-sm
                              font-bold
                              text-slate-900
                            "
                          >
                            {reporter?.username ??
                              "FindBack user"}
                          </p>
                        </div>

                        <p
                          className="
                            mt-1
                            text-xs
                            text-slate-500
                          "
                        >
                          Community member
                        </p>
                      </div>
                    </div>

                    <div
                      className="
                        shrink-0
                        rounded-xl
                        bg-emerald-50
                        px-3.5
                        py-2.5
                        text-right
                      "
                    >
                      <p
                        className="
                          text-[10px]
                          text-emerald-600
                        "
                      >
                        Successful returns
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-sm
                          font-bold
                          text-emerald-700
                        "
                      >
                        {reporter?.successful_returns ??
                          0}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Safety */}

                <section
                  className="
                    rounded-2xl
                    border
                    border-emerald-100
                    bg-emerald-50/50
                    p-4
                  "
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        bg-white
                        text-emerald-600
                        shadow-sm
                      "
                    >
                      <ShieldCheck size={17} />
                    </div>

                    <div>
                      <p
                        className="
                          text-sm
                          font-bold
                          text-emerald-800
                        "
                      >
                        Stay safe when arranging a return
                      </p>

                      <ul
                        className="
                          mt-2
                          space-y-1.5
                          text-xs
                          leading-5
                          text-emerald-700/90
                        "
                      >
                        <li>
                          • Meet in a public and
                          well-lit location.
                        </li>

                        <li>
                          • Verify the item&apos;s
                          identifying details.
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>
              </div>

              {/* =================================================
                  POSSIBLE MATCHES
              ================================================== */}

              {matches.length > 0 && (
                <div
                  className="
                    mt-6
                    border-t
                    border-slate-200/80
                    pt-5
                  "
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        bg-blue-50
                        text-blue-600
                      "
                    >
                      <Sparkles size={14} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p
                          className="
                            text-sm
                            font-bold
                            text-slate-900
                          "
                        >
                          Possible matches
                        </p>

                        <span
                          className="
                            rounded-full
                            bg-blue-50
                            px-2
                            py-0.5
                            text-[10px]
                            font-bold
                            text-blue-700
                          "
                        >
                          {matches.length}
                        </span>
                      </div>

                      <p
                        className="
                          text-xs
                          text-slate-400
                        "
                      >
                        Similar reports
                      </p>
                    </div>
                  </div>

                  <div
                    className="
                      mt-3
                      grid
                      gap-2.5
                      sm:grid-cols-2
                      xl:grid-cols-3
                    "
                  >
                    {matches
                      .slice(0, 3)
                      .map((match) => {
                        const matchInfo =
                          getMatchInfo(
                            match.score,
                          );

                        const href =
                          matchHref
                            ? matchHref(match.id)
                            : `/search/${match.id}`;

                        const matchLocation =
                          [
                            match.city,
                            match.province,
                          ]
                            .filter(Boolean)
                            .join(", ") ||
                          "Location not set";

                        const matchCategory =
                          CATEGORY_LABELS[
                            match.category as keyof typeof CATEGORY_LABELS
                          ] ??
                          match.category;

                        return (
                          <Link
                            key={match.id}
                            href={href}
                            className="
                              group
                              flex
                              min-w-0
                              items-center
                              gap-3
                              rounded-xl
                              border
                              border-slate-200/80
                              bg-white
                              px-3.5
                              py-3
                              transition-all
                              hover:border-blue-200
                              hover:bg-blue-50/40
                              hover:shadow-sm
                            "
                          >
                            <div
                              className={`
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg

                                ${
                                  match.kind ===
                                  "lost"
                                    ? "bg-red-50 text-red-600"
                                    : "bg-emerald-50 text-emerald-600"
                                }
                              `}
                            >
                              {match.kind ===
                              "lost" ? (
                                <Heart size={15} />
                              ) : (
                                <CheckCircle2
                                  size={15}
                                />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`
                                    text-[9px]
                                    font-bold
                                    uppercase

                                    ${
                                      match.kind ===
                                      "lost"
                                        ? "text-red-600"
                                        : "text-emerald-600"
                                    }
                                  `}
                                >
                                  {match.kind}
                                </span>

                                <span
                                  className={`
                                    rounded-full
                                    border
                                    px-2
                                    py-0.5
                                    text-[8px]
                                    font-semibold
                                    ${matchInfo.className}
                                  `}
                                >
                                  {matchInfo.label}
                                </span>
                              </div>

                              <p
                                className="
                                  mt-1
                                  truncate
                                  text-xs
                                  font-bold
                                  text-slate-900
                                  group-hover:text-blue-700
                                "
                              >
                                {match.title}
                              </p>

                              <p
                                className="
                                  mt-0.5
                                  truncate
                                  text-[10px]
                                  text-slate-400
                                "
                              >
                                {matchCategory}
                                {" · "}
                                {matchLocation}
                              </p>
                            </div>

                            <ArrowRight
                              size={13}
                              className="
                                shrink-0
                                text-slate-300
                                transition-all
                                group-hover:translate-x-0.5
                                group-hover:text-blue-600
                              "
                            />
                          </Link>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* =================================================
                ACTION BAR
            ================================================== */}

            <div
              className="
                border-t
                border-slate-200/80
                bg-slate-50/65
                px-7
                py-4
                sm:px-8
                lg:px-9
              "
            >
              {!isOwner ? (
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <MessageButton
                      itemType={itemType}
                      itemId={item.id}
                      label={
                        isLost
                          ? "Message Owner"
                          : "Message Finder"
                      }
                    />
                  </div>

                  <SaveButton
                    lostItemId={
                      isLost
                        ? item.id
                        : undefined
                    }
                    foundItemId={
                      !isLost
                        ? item.id
                        : undefined
                    }
                    savedItemId={savedItemId}
                    isOwner={isOwner}
                  />
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
                  <div className="min-w-[200px] flex-1">
                    <ReportOwnerActions
                      itemType={itemType}
                      itemId={item.id}
                      status={item.status as any}
                    />
                  </div>
                </ReportEditToggle>
              ) : (
                <div
                  className="
                    flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-emerald-50
                    px-4
                    py-3.5
                    text-sm
                    font-semibold
                    text-emerald-700
                  "
                >
                  <CheckCircle2 size={17} />

                  This report has been recovered
                </div>
              )}
            </div>

            {/* =================================================
                FOOTER
            ================================================== */}

            <div
              className="
                flex
                items-center
                justify-between
                gap-4
                border-t
                border-slate-200/70
                px-7
                py-3
                sm:px-8
                lg:px-9
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-[10px]
                  text-slate-400
                "
              >
                <span>
                  Posted {reportDate}
                </span>

                <span>•</span>

                <span className="font-mono">
                  ID {item.id.slice(0, 8)}
                </span>
              </div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-xs
                  text-slate-500
                "
              >
                <Flag size={13} />

                <ReportFlagButton
                  itemType={itemType}
                  itemId={item.id}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          MOBILE METADATA
      ======================================================= */}

      <div
        className="
          mt-3
          flex
          items-center
          justify-center
          gap-2
          text-[10px]
          text-slate-400
          lg:hidden
        "
      >
        <span>
          Posted {reportDate}
        </span>

        <span>•</span>

        <span className="font-mono">
          ID {item.id.slice(0, 8)}
        </span>
      </div>
    </main>
  );
}
