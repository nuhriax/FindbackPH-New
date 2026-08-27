import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Badge system — purely additive presentation layer.
 * Every badge is DERIVED from data that already exists (no DB changes).
 */

export type BadgeStats = {
  successfulReturns: number;
  totalReports: number;
  /** ISO date of the member's oldest report (either table), if any */
  firstReportAt: string | null;
  /** ISO date of the member's newest report, if any */
  lastReportAt: string | null;
  memberSince: string | null;
  emailVerified: boolean;
};

export type BadgeDefinition = {
  id: string;
  emoji: string;
  name: string;
  description: string;
  check: (stats: BadgeStats) => boolean;
};

export const BADGES: BadgeDefinition[] = [
  {
    id: "top-helper",
    emoji: "🏆",
    name: "Top Helper",
    description: "Reunited 5+ items with their owners",
    check: (s) => s.successfulReturns >= 5,
  },
  {
    id: "quick-reporter",
    emoji: "⚡",
    name: "Quick Reporter",
    description: "Filed 3 or more reports",
    check: (s) => s.totalReports >= 3,
  },
  {
    id: "accuracy-pro",
    emoji: "🎯",
    name: "Accuracy Pro",
    description: "Had at least one item successfully reunited",
    check: (s) => s.successfulReturns >= 1,
  },
  {
    id: "trusted-member",
    emoji: "💎",
    name: "Trusted Member",
    description: "Verified email and 1 year of membership",
    check: (s) => {
      if (!s.emailVerified || !s.memberSince) return false;
      return Date.now() - new Date(s.memberSince).getTime() >= 365 * 24 * 60 * 60 * 1000;
    },
  },
  {
    id: "community-hero",
    emoji: "🌐",
    name: "Community Hero",
    description: "Reunited 10+ items with their owners",
    check: (s) => s.successfulReturns >= 10,
  },
  {
    id: "streak-master",
    emoji: "🔥",
    name: "Streak Master",
    description: "Active in the community for 30+ days",
    check: (s) => {
      if (!s.firstReportAt || !s.lastReportAt) return false;
      return (
        new Date(s.lastReportAt).getTime() - new Date(s.firstReportAt).getTime() >=
        30 * 24 * 60 * 60 * 1000
      );
    },
  },
];

/** Pure function — computes which badges are earned for the given stats. */
export function computeBadges(
  stats: BadgeStats
): Array<BadgeDefinition & { earned: boolean }> {
  return BADGES.map((badge) => ({ ...badge, earned: badge.check(stats) }));
}

type Supabase = SupabaseClient<Database>;

/**
 * Reads the (already-public) data needed for badge computation.
 * Read-only; respects RLS. Uses two tiny queries per table
 * (count + extreme dates) rather than loading rows.
 */
export async function getBadgeStats(
  supabase: Supabase,
  userId: string,
  opts?: { memberSince?: string | null; emailVerified?: boolean }
): Promise<BadgeStats> {
  const countReports = (table: "lost_items" | "found_items") =>
    supabase
      .from(table)
      .select("created_at", { count: "exact", head: true })
      .eq("reporter_id", userId);

  const [lostC, foundC, lostFirst, lostLast, foundFirst, foundLast] =
    await Promise.all([
      countReports("lost_items"),
      countReports("found_items"),
      supabase.from("lost_items").select("created_at").eq("reporter_id", userId).order("created_at", { ascending: true }).limit(1),
      supabase.from("lost_items").select("created_at").eq("reporter_id", userId).order("created_at", { ascending: false }).limit(1),
      supabase.from("found_items").select("created_at").eq("reporter_id", userId).order("created_at", { ascending: true }).limit(1),
      supabase.from("found_items").select("created_at").eq("reporter_id", userId).order("created_at", { ascending: false }).limit(1),
    ]);

  const dates = [
    ...(lostFirst.data ?? []),
    ...(lostLast.data ?? []),
    ...(foundFirst.data ?? []),
    ...(foundLast.data ?? []),
  ]
    .map((r) => r.created_at)
    .filter((d): d is string => Boolean(d))
    .sort();

  return {
    successfulReturns: 0, // filled by caller from profiles row
    totalReports: (lostC.count ?? 0) + (foundC.count ?? 0),
    firstReportAt: dates[0] ?? null,
    lastReportAt: dates[dates.length - 1] ?? null,
    memberSince: opts?.memberSince ?? null,
    emailVerified: opts?.emailVerified ?? false,
  };
}
