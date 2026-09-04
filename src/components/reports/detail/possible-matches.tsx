import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CATEGORY_LABELS } from "@/lib/validation";
import type { DetailMatch } from "../report-detail-types";
import { getMatchInfo } from "./match-helpers";

/* ============================================================
   POSSIBLE MATCHES — top cross-report matches for this item
============================================================ */

export function PossibleMatches({
  matches,
  matchHref,
}: {
  matches: DetailMatch[];
  matchHref?: (id: string) => string;
}) {
  if (matches.length === 0) return null;

  return (
    <div>
      <MatchGrid matches={matches.slice(0, 3)} matchHref={matchHref} />
    </div>
  );
}

function MatchGrid({
  matches,
  matchHref,
}: {
  matches: DetailMatch[];
  matchHref?: (id: string) => string;
}) {
  return (
    <div
      className="
        mt-3
        grid
        gap-2.5
        sm:grid-cols-2
        xl:grid-cols-3
      "
    >
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} matchHref={matchHref} />
      ))}
    </div>
  );
}

function MatchCard({
  match,
  matchHref,
}: {
  match: DetailMatch;
  matchHref?: (id: string) => string;
}) {
  const matchInfo = getMatchInfo(match.score);
  const href = matchHref ? matchHref(match.id) : `/search/${match.id}`;
  const matchLocation =
    [match.city, match.province].filter(Boolean).join(", ") ||
    "Location not set";
  const matchCategory =
    CATEGORY_LABELS[
      match.category as keyof typeof CATEGORY_LABELS
    ] ?? match.category;

  return (
    <div
      className="
        min-w-0
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
      <Link href={href} className="group flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`
                text-[9px]
                font-bold
                uppercase

                ${match.kind === "lost" ? "text-sunrise-600" : "text-emerald-600"}
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

      {/* Match confidence bar */}
      {match.score != null && (
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${
              match.score >= 0.75
                ? "bg-emerald-500"
                : match.score >= 0.5
                  ? "bg-blue-500"
                  : "bg-slate-300"
            }`}
            style={{ width: `${Math.round(match.score * 100)}%` }}
          />
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span
          className={`text-[10px] font-bold ${
            match.score != null && match.score >= 0.75
              ? "text-emerald-600"
              : "text-slate-400"
          }`}
        >
          {match.score != null
            ? `${Math.round(match.score * 100)}% match`
            : "Possible match"}
        </span>

        <Link
          href={href}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          This might be mine
          <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}
