import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  MapPin,
  PackageSearch,
  HeartHandshake,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";

import { LiveReportsRefresh } from "@/components/home/live-reports-refresh";
import { Hero, type HeroCard } from "@/components/home/hero";
import { FeedTabs, type FeedCard } from "@/components/home/feed-tabs";
import { StickyActionBar } from "@/components/home/sticky-action-bar";
import { ButtonLink } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getImagePublicUrl, getSignedImageUrls } from "@/lib/storage";
import type {
  FoundItem,
  ItemCategory,
  LostItem,
} from "@/types/database";

/* ============================================================================
   METADATA
   ============================================================================ */

// ISR 60s + Realtime refresh: homepage is cached at edge for 60s (fast),
// but `LiveReportsRefresh` (Supabase Realtime → router.refresh()) still
// pushes live updates when new reports arrive. Previously `force-dynamic`
// forced 7 DB queries on EVERY page load with no CDN cache.
export const revalidate = 60;

export const metadata: Metadata = {
  title: {
    absolute: "FindBack PH — Philippines' Lost & Found Community",
  },
  description:
    "FindBack PH is the Philippines' free community lost-and-found platform. Report what you lost, post what you found, and match safely: your contact details stay private until you choose to share them.",
};

/* ============================================================================
   TYPES
   ============================================================================ */

type RecentCard = FeedCard &
  HeroCard & { createdAt: string | null };

type LostRow = Pick<
  LostItem,
  | "id"
  | "title"
  | "category"
  | "description"
  | "city"
  | "province"
  | "created_at"
  | "view_count"
  | "reward_amount"
>;

type FoundRow = Pick<
  FoundItem,
  | "id"
  | "title"
  | "category"
  | "description"
  | "city"
  | "province"
  | "created_at"
  | "view_count"
>;

/* ============================================================================
   HELPERS
   ============================================================================ */

function formatReportDate(
  value: string | null | undefined
): string {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const difference = Date.now() - date.getTime();

  if (difference < 0) {
    return format(date, "MMM d");
  }

  const minutes = Math.floor(difference / 60000);
  const hours = Math.floor(difference / 3600000);
  const days = Math.floor(difference / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return format(date, "MMM d");
}

function buildRecentCards(
  lostItems: LostRow[],
  foundItems: FoundRow[],
  lostImageMap: Map<string, string>,
  foundImageMap: Map<string, string>
): RecentCard[] {
  const lostCards: RecentCard[] = lostItems.map((item) => ({
    id: item.id,
    href: `/lost/${item.id}`,
    title: item.title,
    category: item.category,
    city: item.city ?? "",
    province: item.province ?? "",
    description: item.description ?? "",
    dateLabel: formatReportDate(item.created_at),
    createdAt: item.created_at,
    kind: "lost",
    imageUrl: lostImageMap.get(item.id) ?? null,
    views: item.view_count ?? null,
    reward: item.reward_amount ?? null,
  }));

  const foundCards: RecentCard[] = foundItems.map((item) => ({
    id: item.id,
    href: `/found/${item.id}`,
    title: item.title,
    category: item.category,
    city: item.city ?? "",
    province: item.province ?? "",
    description: item.description ?? "",
    dateLabel: formatReportDate(item.created_at),
    createdAt: item.created_at,
    kind: "found",
    imageUrl: foundImageMap.get(item.id) ?? null,
    views: item.view_count ?? null,
  }));

  return [...lostCards, ...foundCards]
    .sort((a, b) => {
      const aTime = a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;

      const bTime = b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;

      return bTime - aTime;
    })
    .slice(0, 6);
}

/* ============================================================================
   HOMEPAGE
   ============================================================================ */

export default async function HomePage() {
  const supabase = await createClient();

  /* --------------------------------------------------------------------------
     COUNTS + REPORTS
     -------------------------------------------------------------------------- */

  const [
    lostCountResult,
    foundCountResult,
    recoveredCountResult,
    lostResult,
    foundResult,
  ] = await Promise.all([
    supabase
      .from("lost_items")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "active"),

    supabase
      .from("found_items")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "active"),

    supabase
      .from("lost_items")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "recovered"),

    supabase
      .from("lost_items")
      .select(
        "id, title, category, description, city, province, created_at, view_count, reward_amount"
      )
      .eq("status", "active")
      .order("created_at", {
        ascending: false,
      })
      .limit(8),

    supabase
      .from("found_items")
      .select(
        "id, title, category, description, city, province, created_at, view_count"
      )
      .eq("status", "active")
      .order("created_at", {
        ascending: false,
      })
      .limit(8),
  ]);

  /* --------------------------------------------------------------------------
     ERROR LOGGING
     -------------------------------------------------------------------------- */

  const errors = [
    lostCountResult.error,
    foundCountResult.error,
    recoveredCountResult.error,
    lostResult.error,
    foundResult.error,
  ].filter((e): e is NonNullable<typeof e> => Boolean(e));

  if (errors.length > 0) {
    // PostgREST error objects are class instances and get collapsed to
    // "[{...}]" in the browser dev overlay — log the plain fields so the
    // actual cause (code / message / hint) is always visible.
    console.error(
      "FindBack homepage database error:",
      errors.map((error) => ({
        message: error.message,
        code: "code" in error ? error.code : undefined,
        details: "details" in error ? error.details : undefined,
        hint: "hint" in error ? error.hint : undefined,
      }))
    );
  }

  const lostCount = lostCountResult.count ?? 0;
  const foundCount = foundCountResult.count ?? 0;
  const recoveredCount = recoveredCountResult.count ?? 0;

  const lostItems = (lostResult.data ?? []) as LostRow[];
  const foundItems = (foundResult.data ?? []) as FoundRow[];

  /* --------------------------------------------------------------------------
     IMAGE LOOKUP
     -------------------------------------------------------------------------- */

  const lostIds = lostItems.map((item) => item.id);
  const foundIds = foundItems.map((item) => item.id);

  const [lostImagesResult, foundImagesResult] =
    await Promise.all([
      lostIds.length
        ? supabase
            .from("item_images")
            .select("lost_item_id, storage_path")
            .in("lost_item_id", lostIds)
            .eq("position", 0)
        : Promise.resolve({
            data: [] as {
              lost_item_id: string;
              storage_path: string;
            }[],
          }),

      foundIds.length
        ? supabase
            .from("item_images")
            .select("found_item_id, storage_path")
            .in("found_item_id", foundIds)
            .eq("position", 0)
        : Promise.resolve({
            data: [] as {
              found_item_id: string;
              storage_path: string;
            }[],
          }),
    ]);

  const lostRows = (lostImagesResult.data ?? []).filter(
    (i) => i.lost_item_id && i.storage_path,
  );
  const foundRows = (foundImagesResult.data ?? []).filter(
    (i) => i.found_item_id && i.storage_path,
  );

  const [lostSigned, foundSigned] = await Promise.all([
    getSignedImageUrls(lostRows.map((i) => i.storage_path)),
    getSignedImageUrls(foundRows.map((i) => i.storage_path)),
  ]);

  const lostImageMap = new Map(
    lostRows.map((i, idx) => [
      i.lost_item_id as string,
      lostSigned[idx] ?? getImagePublicUrl(i.storage_path),
    ]),
  );
  const foundImageMap = new Map(
    foundRows.map((i, idx) => [
      i.found_item_id as string,
      foundSigned[idx] ?? getImagePublicUrl(i.storage_path),
    ]),
  );

  /* --------------------------------------------------------------------------
     RECENT REPORTS
     -------------------------------------------------------------------------- */

  const latestReports = buildRecentCards(
    lostItems,
    foundItems,
    lostImageMap,
    foundImageMap
  );

  const totalActive = lostCount + foundCount;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <LiveReportsRefresh />

      {/* 1 — HERO: dual-intent notice-board hero */}
      <Hero totalActive={totalActive} recent={latestReports.slice(0, 3)} recoveredCount={recoveredCount} />

      {/* 2 — LIVE REPORTS with filter tabs */}
      <section
        id="latest-reports"
        aria-labelledby="latest-reports-heading"
        className="scroll-mt-24 px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-electric-600">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Live from the community
              </p>
              <h2
                id="latest-reports-heading"
                className="mt-2 font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl"
              >
                See what needs a way home
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Recent lost and found reports from people across the
                Philippines — updating in real time.
              </p>
            </div>
            <Link
              href="/discover"
              className="group inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-soft transition hover:-translate-y-px hover:border-electric-200 hover:text-electric-700"
            >
              View all reports
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <div className="mt-7">
            {latestReports.length > 0 ? (
              <FeedTabs cards={latestReports} />
            ) : (
              <EmptyReports />
            )}
          </div>
        </div>
      </section>

      {/* 3 — TRUST + SAFETY (links onward to /safety, /faq, /how-it-works) */}
      <section
        aria-labelledby="trust-heading"
        className="relative z-10 px-4 pb-16 sm:px-6 sm:pb-20"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-electric-600">
            Why you can trust FindBack
          </p>
          <h2
            id="trust-heading"
            className="mb-6 mt-2 font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl"
          >
            Safe for both sides of every handover
          </h2>

          <div className="grid overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card sm:grid-cols-3">
            <TrustLink
              href="/safety"
              icon={ShieldCheck}
              title="Private by default"
              detail="Contact details stay hidden until you choose to share them."
              cta="Read our safety guide"
            />
            <TrustLink
              href="/faq"
              icon={UsersRound}
              title="Powered by people"
              detail="Real, live reports from your local community — no middlemen."
              cta="See how matching works"
            />
            <TrustLink
              href="/how-it-works"
              icon={MapPin}
              title="Return with care"
              detail="Verify ownership privately, then meet in a safe, public place."
              cta="See the full process"
            />
          </div>
        </div>
      </section>

      {/* Mobile thumb-reach actions (spacer keeps the footer reachable) */}
      <div aria-hidden="true" className="h-16 md:hidden" />
      <StickyActionBar />
    </main>
  );
}

/* ============================================================================
   TRUST LINK — one trust claim + a concrete onward path. Replaces the old
   dead-end trust cards so every trust claim leads somewhere useful.
   ============================================================================ */

import type { ElementType } from "react";

function TrustLink({
  href,
  icon: Icon,
  title,
  detail,
  cta,
}: {
  href: string;
  icon: ElementType;
  title: string;
  detail: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-start gap-3 border-b border-slate-200/70 px-5 py-5 transition hover:bg-electric-50/40 sm:border-b-0 sm:border-r sm:px-6 sm:py-6 sm:last:border-r-0"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-electric-50 text-electric-700 transition group-hover:bg-electric-100">
        <Icon size={16} aria-hidden="true" />
      </span>
      <div>
        <p className="flex items-center gap-1.5 text-sm font-bold text-navy-900 transition group-hover:text-electric-700">
          {title}
          <ArrowRight
            size={13}
            className="opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
          />
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
          {detail}
        </p>
        <p className="mt-1.5 text-[11px] font-semibold text-electric-600">
          {cta}
        </p>
      </div>
    </Link>
  );
}

/* ============================================================================
   EMPTY REPORTS
   ============================================================================ */

function EmptyReports() {
  return (
    <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm">
        <PackageSearch size={21} />
      </div>

      <h3 className="mt-5 font-display text-xl font-semibold text-navy-900">
        Your community is just getting started
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        No active reports have been posted yet. Be the first
        person to help someone find what they lost.
      </p>

      <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
        <ButtonLink href="/report/lost" size="md">
          <PackageSearch size={15} />
          Report Lost
        </ButtonLink>

        <ButtonLink href="/report/found" variant="outline" size="md">
          <HeartHandshake size={15} />
          Report Found
        </ButtonLink>
      </div>
    </div>
  );
}