/**
 * Shared similarity scoring used by both the server actions (matching engine)
 * and server components (live fallback candidates on detail pages).
 *
 * This module is a thin adapter over the deterministic engine in
 * `@/lib/matching`, so every consumer (listing pages, server actions, report
 * detail pages) uses ONE algorithm with identical weights and explainability.
 * The 0-1 score below is simply the engine's 0-100 score divided by 100.
 */

import { calculateMatch, type MatchableItem } from "@/lib/matching";

export type {
  MatchResult,
  MatchFactor,
  MatchStrength,
} from "@/lib/matching";

/** Minimum score (0-1) required before two items count as a possible match.
 *  Aligned with the engine's "possible" threshold (40/100). */
export const MATCH_THRESHOLD = 0.4;

export function computeMatchScore(
  lost: Partial<Omit<MatchableItem, "date">> & { date_lost?: string | null },
  found: Partial<Omit<MatchableItem, "date">> & { date_found?: string | null },
): number {
  const result = calculateMatch(
    {
      id: lost.id ?? "",
      title: lost.title ?? "",
      category: lost.category ?? "",
      city: lost.city ?? null,
      province: lost.province ?? null,
      approximate_location: lost.approximate_location ?? null,
      date: lost.date_lost ?? null,
      description: lost.description ?? "",
      distinguishing_features: lost.distinguishing_features ?? null,
      photoHashes: lost.photoHashes ?? null,
    },
    {
      id: found.id ?? "",
      title: found.title ?? "",
      category: found.category ?? "",
      city: found.city ?? null,
      province: found.province ?? null,
      approximate_location: found.approximate_location ?? null,
      date: found.date_found ?? null,
      description: found.description ?? "",
      distinguishing_features: found.distinguishing_features ?? null,
      photoHashes: found.photoHashes ?? null,
    }
  );

  return result ? result.score / 100 : 0;
}

/** Explainable variant for callers that want factor breakdowns. */
export function computeMatchWithFactors(
  lost: Parameters<typeof computeMatchScore>[0],
  found: Parameters<typeof computeMatchScore>[1]
) {
  return calculateMatch(
    {
      id: lost.id ?? "",
      title: lost.title ?? "",
      category: lost.category ?? "",
      city: lost.city ?? null,
      province: lost.province ?? null,
      approximate_location: lost.approximate_location ?? null,
      date: lost.date_lost ?? null,
      description: lost.description ?? "",
      distinguishing_features: lost.distinguishing_features ?? null,
      photoHashes: lost.photoHashes ?? null,
    },
    {
      id: found.id ?? "",
      title: found.title ?? "",
      category: found.category ?? "",
      city: found.city ?? null,
      province: found.province ?? null,
      approximate_location: found.approximate_location ?? null,
      date: found.date_found ?? null,
      description: found.description ?? "",
      distinguishing_features: found.distinguishing_features ?? null,
      photoHashes: found.photoHashes ?? null,
    }
  );
}
