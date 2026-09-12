import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  FileText,
  GraduationCap,
  HeartHandshake,
  type LucideIcon,
  KeyRound,
  Laptop,
  Lock,
  MapPin,
  Package,
  PackageSearch,
  PawPrint,
  Search,
  Shirt,
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
import { ButtonLink } from "@/components/ui/button";
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
  /** Lost items only — offered reward, shown as a chip on the card. */
  reward?: number | null;
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
   CATEGORIES
   ============================================================================ */

/**
 * Full browse grid — ALL categories the platform supports, using the exact
 * values `searchParamsSchema` validates against (`src/lib/validation.ts`).
 * The old "popular" chip list linked to invalid singular values
 * (`phone`, `wallet`, `jewelry`) that the search schema rejected, so those
 * filters silently did nothing. Every tile here filters correctly.
 */
const categories: { label: string; value: string; icon: LucideIcon }[] = [
  { label: "Phones & Tablets", value: "phones", icon: Smartphone },
  { label: "Wallets", value: "wallets", icon: WalletCards },
  { label: "IDs", value: "ids", icon: BadgeCheck },
  { label: "Bags", value: "bags", icon: Briefcase },
  { label: "Keys", value: "keys", icon: KeyRound },
  { label: "Jewelry & Watches", value: "jewelry", icon: Watch },
  { label: "Electronics", value: "electronics", icon: Laptop },
  { label: "Documents", value: "documents", icon: FileText },
  { label: "Clothing", value: "clothing", icon: Shirt },
  { label: "Pets", value: "pets", icon: PawPrint },
  { label: "School Items", value: "school_items", icon: GraduationCap },
  { label: "Other", value: "other", icon: Package },
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

  return (
    <main className="relative min-h-screen">
      <LiveReportsRefresh />

      {/* HERO */}
      <section className="relative px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-12">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl lg:text-5xl">
              Lost something? Found something?
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base text-slate-600 sm:text-lg">
              From phones and wallets to IDs, bags, pets, and documents — search
              community reports or post your own. Free, private, and built for
              the Philippines.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-2xl">
            <form action="/discover" method="GET" role="search" className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center">
              <div className="flex min-h-[48px] flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3">
                <Search size={18} className="shrink-0 text-slate-400" />
                <input name="q" type="search" maxLength={120} placeholder="e.g. iPhone, wallet, keys, school ID" aria-label="Search reports" className="w-full bg-transparent text-sm text-navy-900 outline-none placeholder:text-slate-500" />
              </div>
              <button type="submit" className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-lg bg-electric-500 px-6 text-sm font-semibold text-white transition hover:bg-electric-600">
                <Search size={16} />
                Search
              </button>
            </form>
            <p className="mt-3 text-center text-xs text-slate-500">Search by item name, category, or location</p>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/report/lost" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sunrise-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sunrise-600 sm:w-auto">
              <PackageSearch size={16} />
              I lost something
            </Link>
            <Link href="/report/found" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto">
              <HeartHandshake size={16} />
              I found something
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST STRIP — privacy + free + safe, critical for lost & found conversion */}
      <section className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
        <div className="grid gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-3 shadow-sm backdrop-blur-sm sm:grid-cols-3 sm:p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50/70 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-electric-50 text-electric-600 ring-1 ring-inset ring-electric-200/60">
              <Lock size={14} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-navy-900">Private by default</p>
              <p className="text-[11px] leading-tight text-slate-500">Contact hidden until you choose to share</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50/70 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200/60">
              <BadgeCheck size={14} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-navy-900">Free forever</p>
              <p className="text-[11px] leading-tight text-slate-500">No fees, community-powered for PH</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50/70 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/60">
              <ShieldCheck size={14} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-navy-900">Safe handover</p>
              <p className="text-[11px] leading-tight text-slate-500">Meet at mall, barangay hall, café</p>
            </div>
          </div>
        </div>
      </section>

      {/* BROWSE BY CATEGORY — full 12-category grid, all filters valid */}
      <section aria-labelledby="browse-categories" className="px-4 pb-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p id="browse-categories" className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
            Browse by category
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.value}
                  href={`/discover?category=${encodeURIComponent(category.value)}`}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-electric-300 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-500 transition group-hover:border-electric-200 group-hover:bg-electric-50 group-hover:text-electric-600">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold leading-tight text-navy-900">
                    {category.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-slate-200/70 bg-slate-50/50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-px overflow-hidden rounded-xl border border-slate-200/70 bg-slate-200/50 sm:grid-cols-3">
                <Stat
                  value={lostCount}
                  label="Active lost reports"
                  caption="still being looked for"
                  icon={PackageSearch}
                />

                <Stat
                  value={foundCount}
                  label="Active found reports"
                  caption="waiting to go home"
                  icon={HeartHandshake}
                />

                <Stat
                  value={recoveredCount}
                  label="Items recovered"
                  caption="and counting"
                  icon={ShieldCheck}
                  featured
                />
          </div>
        </div>
      </section>

      {/* RECENT REPORTS */}
      <section className="px-4 pb-12 pt-10 sm:px-6 sm:pb-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">
                Latest reports
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Recently reported by the community.
              </p>
            </div>

            <Link
              href="/discover"
              className="inline-flex items-center gap-2 text-sm font-semibold text-electric-700 transition hover:text-electric-600"
            >
              View all reports
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* QUICK FILTERS */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/lost"
              className="inline-flex items-center gap-2 rounded-full border border-sunrise-200 bg-sunrise-50 px-4 py-2 text-xs font-semibold text-sunrise-700 transition hover:bg-sunrise-100"
            >
              <PackageSearch size={13} />
              Lost
              <span className="text-sunrise-500/70">{lostCount}</span>
            </Link>

            <Link
              href="/found"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <HeartHandshake size={13} />
              Found
              <span className="text-emerald-500/70">{foundCount}</span>
            </Link>

            <Link
              href="/discover"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Search size={13} />
              Search all
            </Link>
          </div>

          {/* REPORT GRID */}
          {latestReports.length > 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {latestReports.map((item) => (
                <MotionReveal
                  key={`${item.kind}-${item.id}`}
                  className="h-full"
                >
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
                    reward={item.reward}
                  />
                </MotionReveal>
              ))}
            </div>
          ) : (
            <EmptyReports />
          )}
        </div>
      </section>

      {/* SAFETY */}
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-600">
              <ShieldCheck size={20} />
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-semibold text-navy-900">
                Meet in a safe, public place
              </h3>
              <p className="mt-0.5 text-sm text-slate-600">
                Keep personal info private until you&apos;re ready to share. Choose a busy mall, barangay hall, or café for handovers.
              </p>
            </div>

            <Link
              href="/safety"
              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Safety guide
              <ArrowRight size={13} />
            </Link>
          </div>
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
  caption,
  icon: Icon,
  featured = false,
}: {
  value: number;
  label: string;
  caption?: string;
  icon?: LucideIcon;
  featured?: boolean;
}) {
  return (
    <div
      className={`relative px-6 py-7 sm:px-8 sm:py-8 ${
        featured ? "bg-emerald-50/60" : "bg-white/80"
      }`}
    >
      {featured && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent"
        />
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </p>

        {Icon && (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm ${
              featured
                ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            <Icon size={16} aria-hidden="true" />
          </span>
        )}
      </div>

      <div
        className={`mt-3 display-giant text-4xl sm:text-5xl lg:text-[3.2rem] ${
          featured ? "text-emerald-600" : "text-navy-900"
        }`}
      >
        <AnimatedNumber value={Math.max(0, Math.round(value))} />
      </div>

      {caption && (
        <p
          className={`mt-1.5 text-xs ${
            featured ? "font-medium text-emerald-700/80" : "text-slate-400"
          }`}
        >
          {caption}
        </p>
      )}
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
