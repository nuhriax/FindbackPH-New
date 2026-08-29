import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  HeartHandshake,
  KeyRound,
  Laptop,
  Lock,
  MapPin,
  PackageSearch,
  Search,
  ShieldCheck,
  Smartphone,
  WalletCards,
  Watch,
} from "lucide-react";
import { format } from "date-fns";

import { Reveal } from "@/components/reveal";
import { SplitText } from "@/components/effects/split-text";
import { MotionReveal } from "@/components/effects/motion-reveal";
import { Aurora } from "@/components/effects/aurora";
import { CommunityMotif } from "@/components/ui/community-motif";
import { LiveReportsRefresh } from "@/components/home/live-reports-refresh";
import { PaperNotes } from "@/components/ui/paper-notes";
import { ItemCard } from "@/components/item-card";
import { AnimatedNumber } from "@/components/home/animated-number";
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

// The homepage data is refreshed in real time via `LiveReportsRefresh`
// (Supabase Realtime → `router.refresh()`). Dynamic rendering keeps the
// homepage's Supabase queries from being cached in Next's Data Cache so that
// `router.refresh()` always re-fetches the latest reports from the database.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "FindBack PH — Philippines' Lost & Found Community",
  },
  description:
    "Search and report lost or found items anywhere in the Philippines. Post what you lost or found, get matched with a possible owner, and reunite safely with FindBack PH.",
};

/* ============================================================================
   TYPES
   ============================================================================ */

type RecentCard = {
  id: string;
  href: string;
  title: string;
  category: ItemCategory;
  city: string;
  province: string;
  description: string;
  dateLabel: string;
  createdAt: string | null;
  kind: "lost" | "found";
  imageUrl?: string | null;
  views?: number | null;
};

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
   CATEGORIES
   ============================================================================ */

const categories = [
  {
    label: "Phones",
    value: "phone",
    icon: Smartphone,
  },
  {
    label: "Wallets",
    value: "wallet",
    icon: WalletCards,
  },
  {
    label: "Keys",
    value: "keys",
    icon: KeyRound,
  },
  {
    label: "Electronics",
    value: "electronics",
    icon: Laptop,
  },
  {
    label: "Jewelry",
    value: "jewelry",
    icon: Watch,
  },
];

/** Popular Philippine search destinations, linked to the search page. */
const POPULAR_CITIES = [
  "Quezon City",
  "Manila",
  "Cebu City",
  "Makati",
  "Davao City",
  "Taguig",
  "Pasig",
  "Mandaluyong",
];

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
        "id, title, category, description, city, province, created_at, view_count"
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
  ].filter(Boolean);

  if (errors.length > 0) {
    console.error(
      "FindBack homepage database error:",
      errors
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

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* ====================================================================
          LIVE REPORT LISTENER
          ==================================================================== */}

      <LiveReportsRefresh />

      {/* ====================================================================
          BACKGROUND
          ==================================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-44 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-electric-100/[0.55] blur-[130px]" />

        <div className="absolute -left-56 top-[8%] h-[32rem] w-[32rem] rounded-full bg-sky-200/[0.35] blur-3xl" />

        <div className="absolute -right-56 top-[14%] h-[32rem] w-[32rem] rounded-full bg-lavender-200/[0.45] blur-3xl" />

        <div className="absolute -bottom-48 left-1/4 h-[34rem] w-[34rem] rounded-full bg-ice-200/[0.5] blur-[130px]" />
      </div>

      {/* ====================================================================
          HERO
          ==================================================================== */}

      <section className="relative overflow-hidden px-4 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:pb-20 lg:pt-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-emerald-50/80 via-transparent to-transparent" />

          <svg
            viewBox="0 0 1200 140"
            preserveAspectRatio="none"
            className="absolute -bottom-1 left-0 h-32 w-full opacity-70"
          >
            <path
              d="M0 118 C 200 66, 420 108, 620 90 C 840 70, 1020 96, 1200 68 V140 H0 Z"
              fill="#cde8d4"
            />

            <path
              d="M0 132 C 260 102, 540 128, 780 112 C 980 98, 1120 118, 1200 106 V140 H0 Z"
              fill="#e5f0e7"
            />
          </svg>

          <Aurora opacity={0.3} blur={72} />
        </div>

        <PaperNotes />

        <CommunityMotif className="absolute bottom-1 left-0 hidden w-64 opacity-70 lg:block" />

        <CommunityMotif className="absolute bottom-1 right-8 hidden w-64 opacity-70 lg:block" />

        <div className="relative z-10 mx-auto max-w-5xl">
          {/* ----------------------------------------------------------------
              TITLE
              ---------------------------------------------------------------- */}

          <div className="mx-auto max-w-3xl text-center">
            <MotionReveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-electric-200 bg-electric-50 px-3 py-1.5 text-xs font-semibold text-electric-700 shadow-sm">
                <Search size={13} />
                FindBack PH
              </div>
            </MotionReveal>

            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.04] tracking-tight text-navy-900 sm:text-5xl lg:text-6xl">
              <SplitText
                segments={[
                  {
                    text: "Find what you ",
                  },
                  {
                    text: "lost",
                    className: "text-sunrise-500",
                  },
                  {
                    text: ". Return what you ",
                  },
                  {
                    text: "found",
                    className: "text-emerald-500",
                  },
                  {
                    text: ".",
                  },
                ]}
              />
            </h1>

            <MotionReveal delay={260}>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                A community-powered way to find lost belongings
                and help return the things others are looking for.
              </p>
            </MotionReveal>
          </div>

          {/* ----------------------------------------------------------------
              PRIMARY CTAs
              ---------------------------------------------------------------- */}

          <Reveal delay={80}>
            <div className="mx-auto mt-9 max-w-3xl">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-center sm:gap-3">
                <Link
                  href="/search"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-electric-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-electric-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-electric-100 sm:w-auto"
                >
                  <Search
                    size={16}
                    className="transition-transform duration-200 group-hover:-translate-y-0.5"
                  />
                  Find my item
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </Link>

                <Link
                  href="/report/lost"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-navy-900 shadow-sm transition hover:border-electric-200 hover:bg-electric-50 hover:text-electric-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-electric-100 sm:w-auto"
                >
                  <PackageSearch
                    size={15}
                    className="text-sunrise-500 transition-transform duration-200 group-hover:scale-110"
                  />
                  Report lost item
                </Link>

                <Link
                  href="/report/found"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-navy-900 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-electric-100 sm:w-auto"
                >
                  <HeartHandshake
                    size={15}
                    className="text-emerald-500 transition-transform duration-200 group-hover:scale-110"
                  />
                  Report found item
                </Link>
              </div>

              <p className="mt-3 text-center text-[11px] text-slate-500">
                Search by item, location, category, or description
              </p>
            </div>
          </Reveal>

          {/* ----------------------------------------------------------------
              CATEGORIES
              ---------------------------------------------------------------- */}

          <Reveal delay={120}>
            <div className="mx-auto mt-6 max-w-3xl">
              <div className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Popular categories
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((category) => {
                  const Icon = category.icon;

                  return (
                    <Link
                      key={category.value}
                      href={`/search?category=${encodeURIComponent(
                        category.value
                      )}`}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-electric-200 hover:bg-electric-50 hover:text-electric-700"
                    >
                      <Icon size={14} />
                      {category.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-5 text-center">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Or browse by popular location
                </span>

                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {POPULAR_CITIES.map((city) => (
                    <Link
                      key={city}
                      href={`/search?city=${encodeURIComponent(city)}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/85 px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-electric-200 hover:bg-electric-50 hover:text-electric-700"
                    >
                      <MapPin size={13} />
                      {city}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-3 text-center">
                <Link
                  href="/search"
                  className="text-xs font-medium text-slate-500 underline-offset-4 transition hover:text-electric-700 hover:underline"
                >
                  Browse all 12 categories
                </Link>
              </div>
            </div>
          </Reveal>

          {/* ----------------------------------------------------------------
              ACTIONS
              ---------------------------------------------------------------- */}

          <Reveal delay={160}>
            <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
              <Link
                href="/report/lost"
                className="group relative overflow-hidden rounded-2xl border border-sunrise-200 bg-gradient-to-br from-sunrise-50 to-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-sunrise-300 hover:shadow-lg hover:shadow-sunrise-100/60"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-sunrise-200 bg-sunrise-100 text-sunrise-700">
                    <PackageSearch size={20} />
                  </span>

                  <ArrowRight
                    size={18}
                    className="text-sunrise-500 transition-transform group-hover:translate-x-1"
                  />
                </div>

                <p className="mt-4 text-base font-semibold text-navy-900">
                  I lost something
                </p>

                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Search reports or tell the community what you
                  lost.
                </p>
              </Link>

              <Link
                href="/report/found"
                className="group relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/60"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100 text-emerald-700">
                    <HeartHandshake size={20} />
                  </span>

                  <ArrowRight
                    size={18}
                    className="text-emerald-500 transition-transform group-hover:translate-x-1"
                  />
                </div>

                <p className="mt-4 text-base font-semibold text-navy-900">
                  I found something
                </p>

                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Report it and help get it back to its owner.
                </p>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ====================================================================
          STATS
          ==================================================================== */}

      <section className="px-4 py-5 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="grid overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 shadow-soft backdrop-blur-sm sm:grid-cols-3">
              <Stat
                value={lostCount}
                label="Active lost reports"
              />

              <div className="border-t border-slate-100 sm:border-l sm:border-t-0">
                <Stat
                  value={foundCount}
                  label="Active found reports"
                  accent
                />
              </div>

              <div className="border-t border-slate-100 sm:border-l sm:border-t-0">
                <Stat
                  value={recoveredCount}
                  label="Items recovered"
                  accent
                />
              </div>
            </div>

            <p className="mt-4 text-center text-sm leading-relaxed text-slate-600">
              Every recovered report is one more item back where it belongs —
              together we&apos;ve brought{" "}
              <span className="font-semibold text-emerald-600">
                {recoveredCount}
              </span>{" "}
              {recoveredCount === 1 ? "item" : "items"} home.
            </p>

            {lostCount === 0 && foundCount === 0 && recoveredCount === 0 && (
              <p className="mt-4 text-center text-sm leading-relaxed text-slate-500">
                Your community starts here — be the first to report a lost or
                found item in your area.
              </p>
            )}
          </Reveal>
        </div>
      </section>

      {/* ====================================================================
          RECENT REPORTS
          ==================================================================== */}

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-electric-600">
                  Community reports
                </p>

                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
                  Recently reported
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                  See the latest lost and found reports from the
                  community.
                </p>
              </div>

              <Link
                href="/search"
                className="inline-flex items-center gap-2 text-sm font-semibold text-electric-700 transition hover:text-electric-600"
              >
                View all reports
                <ArrowRight size={15} />
              </Link>
            </div>
          </Reveal>

          {/* FILTERS */}

          <Reveal delay={60}>
            <div className="mt-7 flex flex-wrap gap-2">
              <Link
                href="/lost"
                className="inline-flex items-center gap-2 rounded-full border border-sunrise-200 bg-sunrise-50 px-4 py-2 text-xs font-semibold text-sunrise-700 transition hover:bg-sunrise-100"
              >
                <PackageSearch size={13} />
                Lost
                <span className="text-sunrise-500/70">
                  {lostCount}
                </span>
              </Link>

              <Link
                href="/found"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <HeartHandshake size={13} />
                Found
                <span className="text-emerald-500/70">
                  {foundCount}
                </span>
              </Link>

              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <Search size={13} />
                Search all
              </Link>
            </div>
          </Reveal>

          {/* REPORT GRID */}

          {latestReports.length > 0 ? (
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {latestReports.map((item, index) => (
                <MotionReveal
                  key={`${item.kind}-${item.id}`}
                  delay={(index % 3) * 60}
                  className="h-full"
                >
                  <div className="relative h-full">
                    <div className="pointer-events-none absolute left-4 top-4 z-10">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${
                          item.kind === "lost"
                            ? "border-sunrise-200 bg-white/90 text-sunrise-700"
                            : "border-emerald-200 bg-white/90 text-emerald-700"
                        }`}
                      >
                        {item.kind === "lost" ? (
                          <PackageSearch size={11} />
                        ) : (
                          <HeartHandshake size={11} />
                        )}

                        {item.kind}
                      </span>
                    </div>

                    <ItemCard
                      href={item.href}
                      title={item.title}
                      category={item.category}
                      city={item.city}
                      province={item.province}
                      reported={item.dateLabel}
                      description={item.description}
                      kind={item.kind}
                      imageUrl={item.imageUrl}
                      views={item.views}
                    />
                  </div>
                </MotionReveal>
              ))}
            </div>
          ) : (
            <EmptyReports />
          )}
        </div>
      </section>

      {/* ====================================================================
          SAFETY
          ==================================================================== */}

      <section className="px-4 pb-16 pt-4 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-electric-100/80 bg-white/90 p-5 shadow-soft sm:p-6">
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-electric-50 blur-3xl" />

              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-electric-200 bg-electric-50 text-electric-700">
                  <ShieldCheck size={20} />
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-navy-900">
                    Keep your handover safe
                  </h3>

                  <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-sm">
                    Keep personal information private and choose a
                    safe, public place when meeting someone.
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-slate-600">
                  <Lock size={13} />
                  Privacy focused
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

/* ============================================================================
   STAT
   ============================================================================ */

function Stat({
  value,
  label,
  accent = false,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="px-4 py-5 text-center sm:px-6 sm:py-6">
      <div
        className={`font-display text-2xl font-bold tabular-nums sm:text-3xl ${
          accent ? "text-emerald-600" : "text-navy-900"
        }`}
      >
        <AnimatedNumber
          value={Math.max(0, Math.round(value))}
        />
      </div>

      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">
        {label}
      </p>
    </div>
  );
}

/* ============================================================================
   EMPTY REPORTS
   ============================================================================ */

function EmptyReports() {
  return (
    <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm">
        <Search size={21} />
      </div>

      <h3 className="mt-5 font-display text-xl font-semibold text-navy-900">
        Your community is just getting started
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        No active reports have been posted yet. Be the first
        person to help someone find what they lost.
      </p>

      <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
        <Link
          href="/report/lost"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-electric-500"
        >
          <PackageSearch size={15} />
          Report Lost
        </Link>

        <Link
          href="/report/found"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-navy-900 transition hover:bg-slate-50"
        >
          <HeartHandshake size={15} />
          Report Found
        </Link>
      </div>
    </div>
  );
}
