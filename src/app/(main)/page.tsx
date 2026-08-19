import Link from "next/link";
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
import { CommunityMotif } from "@/components/ui/community-motif";
import { CommunityStories } from "@/components/home/community-stories";
import { PaperNotes } from "@/components/ui/paper-notes";
import { ItemCard } from "@/components/item-card";
import { AnimatedNumber } from "@/components/home/animated-number";
import { createClient } from "@/lib/supabase/server";
import { getImagePublicUrl } from "@/lib/storage";
import type { FoundItem, ItemCategory, LostItem } from "@/types/database";

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
};

/* ============================================================================
   HELPERS
   ============================================================================ */

function formatReportDate(value: string | null | undefined): string {
  if (!value) return "Recently reported";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently reported";
  }

  return format(date, "MMM d, yyyy");
}

function getRelativeDate(value: string | null | undefined): string {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const now = Date.now();
  const difference = now - date.getTime();

  const minutes = Math.floor(difference / 60000);
  const hours = Math.floor(difference / 3600000);
  const days = Math.floor(difference / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return format(date, "MMM d");
}

/* ============================================================================
   CATEGORY DATA
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

/* ============================================================================
   HOMEPAGE
   ============================================================================ */

export const metadata = {
  title: "FindBack PH — Reunite Lost & Found Items",
  description:
    "FindBack PH helps Philippine communities reunite with lost items and return found ones — search community reports, report an item, and bring things home safely and locally.",
};

export default async function HomePage() {
  const supabase = createClient();

  /* --------------------------------------------------------------------------
     REAL PLATFORM COUNTS
     -------------------------------------------------------------------------- */

  const [
    { count: lostCount },
    { count: foundCount },
    { count: recoveredCount },
  ] = await Promise.all([
    supabase
      .from("lost_items")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "active"),

    supabase
      .from("found_items")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "active"),

    supabase
      .from("lost_items")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "recovered"),
  ]);

  /* --------------------------------------------------------------------------
     RECENT LOST + FOUND
     -------------------------------------------------------------------------- */

  const [lostRes, foundRes] = await Promise.all([
    supabase
      .from("lost_items")
      .select(
        "id, title, category, description, city, province, created_at"
      )
      .eq("status", "active")
      .order("created_at", {
        ascending: false,
      })
      .limit(8),

    supabase
      .from("found_items")
      .select(
        "id, title, category, description, city, province, created_at"
      )
      .eq("status", "active")
      .order("created_at", {
        ascending: false,
      })
      .limit(8),
  ]);

  const lostItems = (lostRes.data ?? []) as Pick<
    LostItem,
    | "id"
    | "title"
    | "category"
    | "description"
    | "city"
    | "province"
    | "created_at"
  >[];

  const foundItems = (foundRes.data ?? []) as Pick<
    FoundItem,
    | "id"
    | "title"
    | "category"
    | "description"
    | "city"
    | "province"
    | "created_at"
  >[];

  /* --------------------------------------------------------------------------
     IMAGE LOOKUP
     -------------------------------------------------------------------------- */

  const lostIds = lostItems.map((item) => item.id);
  const foundIds = foundItems.map((item) => item.id);

  const [lostImagesRes, foundImagesRes] = await Promise.all([
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

  const lostImageMap = new Map<string, string>();
  const foundImageMap = new Map<string, string>();

  for (const image of lostImagesRes.data ?? []) {
    if (image.lost_item_id && image.storage_path) {
      lostImageMap.set(
        image.lost_item_id,
        getImagePublicUrl(image.storage_path)
      );
    }
  }

  for (const image of foundImagesRes.data ?? []) {
    if (image.found_item_id && image.storage_path) {
      foundImageMap.set(
        image.found_item_id,
        getImagePublicUrl(image.storage_path)
      );
    }
  }

  /* --------------------------------------------------------------------------
     BUILD REPORT CARDS
     -------------------------------------------------------------------------- */

  const recentCards: RecentCard[] = [
    ...lostItems.map((item) => ({
      id: item.id,
      href: `/lost/${item.id}`,
      title: item.title,
      category: item.category,
      city: item.city ?? "",
      province: item.province ?? "",
      description: item.description ?? "",
      dateLabel: formatReportDate(item.created_at),
      createdAt: item.created_at,
      kind: "lost" as const,
      imageUrl: lostImageMap.get(item.id),
    })),

    ...foundItems.map((item) => ({
      id: item.id,
      href: `/found/${item.id}`,
      title: item.title,
      category: item.category,
      city: item.city ?? "",
      province: item.province ?? "",
      description: item.description ?? "",
      dateLabel: formatReportDate(item.created_at),
      createdAt: item.created_at,
      kind: "found" as const,
      imageUrl: foundImageMap.get(item.id),
    })),
  ];

  /* --------------------------------------------------------------------------
     SORT BY REAL CREATED DATE
     -------------------------------------------------------------------------- */

  recentCards.sort((a, b) => {
    const aTime = a.createdAt
      ? new Date(a.createdAt).getTime()
      : 0;

    const bTime = b.createdAt
      ? new Date(b.createdAt).getTime()
      : 0;

    return bTime - aTime;
  });

  const latestReports = recentCards.slice(0, 6);

  /* --------------------------------------------------------------------------
     NEARBY / LOCAL REPORTS
     
     This uses the location data you already have.
     It does not pretend to know the user's GPS location.
     -------------------------------------------------------------------------- */

  const localReports = recentCards
    .filter((item) => item.city || item.province)
    .slice(0, 3);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* ====================================================================
          BACKGROUND
          ==================================================================== */}

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Soft blue atmosphere - gentle light from the top, pale blue + pale green/orange warming the edges */}
        <div className="absolute -top-44 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-electric-100/[0.55] blur-[130px]" />
        <div className="absolute -left-56 top-[8%] h-[32rem] w-[32rem] rounded-full bg-sky-200/[0.35] blur-3xl" />
        <div className="absolute -right-56 top-[14%] h-[32rem] w-[32rem] rounded-full bg-lavender-200/[0.45] blur-3xl" />
        <div className="absolute -bottom-48 left-1/4 h-[34rem] w-[34rem] rounded-full bg-ice-200/[0.5] blur-[130px]" />
      </div>

      {/* ====================================================================
          HERO / SEARCH
          ==================================================================== */}

      <section className="relative overflow-hidden px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:pt-20">
        {/* Warm community horizon backdrop */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-emerald-50/70 via-transparent to-transparent" />
          <svg viewBox="0 0 1200 140" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-32 w-full opacity-70">
            <path d="M0 118 C 200 66, 420 108, 620 90 C 840 70, 1020 96, 1200 68 V140 H0 Z" fill="#cde8d4" />
            <path d="M0 132 C 260 102, 540 128, 780 112 C 980 98, 1120 118, 1200 106 V140 H0 Z" fill="#e5f0e7" />
          </svg>
        </div>

        {/* Friendly floating paper notes around the hero edges */}
        <PaperNotes />
        {/* Quiet “path home” motif on the hero backdrop (outside the centred content) */}
        <CommunityMotif className="absolute bottom-1 left-0 hidden w-64 opacity-80 lg:block" />
        <CommunityMotif className="absolute bottom-1 right-8 hidden w-64 opacity-80 lg:block" />
        <div className="relative z-10 mx-auto max-w-5xl">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-electric-200 bg-electric-50 px-3 py-1.5 text-xs font-semibold text-electric-700">
                <Search size={13} />
                FindBack PH
              </div>

              <h1 className="mt-6 font-display text-4xl font-bold leading-[1.04] tracking-tight text-navy-900 sm:text-5xl lg:text-6xl">
                Find what you{" "}
                <span className="text-sunrise-500">lost</span>.
                <br />
                Return what you{" "}
                <span className="text-emerald-500">found</span>.
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Search lost and found reports from your community,
                or report an item and help get it back to its owner.
              </p>
            </div>
          </Reveal>

          {/* SEARCH */}

          <Reveal delay={80}>
            <form
              action="/search"
              method="GET"
              className="mx-auto mt-8 max-w-3xl"
            >
              <div className="group flex items-center rounded-2xl border border-electric-100/80 bg-white/95 p-2 shadow-soft ring-1 ring-slate-200/30 transition-all duration-300 focus-within:border-electric-300 focus-within:shadow-electric-500/[0.08]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center text-slate-400">
                  <Search size={21} />
                </div>

                <input
                  name="q"
                  type="search"
                  placeholder="Search for an item..."
                  aria-label="Search for an item"
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent px-1 text-sm text-navy-900 outline-none placeholder:text-slate-400 sm:text-base"
                />

                <button
                  type="submit"
                  className="hidden shrink-0 items-center gap-2 rounded-xl bg-gradient-to-b from-electric-500 to-electric-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_-12px_rgba(15,123,122,0.7)] transition hover:from-electric-400 hover:to-electric-500 sm:flex"
                >
                  Search
                  <ArrowRight size={16} />
                </button>
              </div>

              <button
                type="submit"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-electric-500 to-electric-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_-12px_rgba(15,123,122,0.7)] transition hover:from-electric-400 hover:to-electric-500 sm:hidden"
              >
                Search
                <ArrowRight size={16} />
              </button>
            </form>
          </Reveal>

          {/* CATEGORY SHORTCUTS */}

          <Reveal delay={120}>
            <div className="mx-auto mt-5 max-w-3xl">
              <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Popular categories
              </div>

              <div className="mb-3 flex justify-center">
                <Link
                  href="/search"
                  className="text-xs font-medium text-slate-600 underline-offset-4 hover:text-electric-700 hover:underline"
                >
                  Browse all 12 categories
                </Link>
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
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:border-navy-200 hover:bg-navy-50 hover:text-navy-800"
                    >
                      <Icon size={14} />
                      {category.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {/* MAIN ACTIONS */}

          <Reveal delay={160}>
            <div className="relative mx-auto mt-7 grid max-w-3xl gap-3 sm:grid-cols-2">
              {/* Subtle "reunion" node linking Lost ↔ Found — a quiet cue that
                  these two sides meet and reconnect. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 sm:block"
              >
                <div className="flex items-center">
                  <span className="h-px w-8 bg-gradient-to-r from-transparent to-sunrise-300" />
                  <span className="mx-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-sunrise-200 bg-white/95 shadow-soft">
                    <HeartHandshake size={13} className="text-sunrise-500" />
                  </span>
                  <span className="h-px w-8 bg-gradient-to-l from-transparent to-sunrise-300" />
                </div>
              </div>

              <Link
                href="/report/lost"
                className="group flex items-center justify-between rounded-2xl border border-sunrise-200 bg-sunrise-50/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-sunrise-300 hover:bg-sunrise-50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-sunrise-200 bg-sunrise-100 text-sunrise-700">
                    <PackageSearch size={20} />
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-navy-900">
                      I lost something
                    </p>

                    <p className="mt-0.5 text-xs text-slate-600">
                      Search or report your item
                    </p>
                  </div>
                </div>

                <ArrowRight
                  size={17}
                  className="text-sunrise-600 transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/report/found"
                className="group flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100 text-emerald-600">
                    <HeartHandshake size={20} />
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-navy-900">
                      I found something
                    </p>

                    <p className="mt-0.5 text-xs text-slate-600">
                      Help return it to its owner
                    </p>
                  </div>
                </div>

                <ArrowRight
                  size={17}
                  className="text-emerald-600 transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ====================================================================
          STATS
          ==================================================================== */}

      <section className="px-4 pb-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Reveal delay={180}>
                        <div className="overflow-hidden rounded-3xl border border-sunrise-100/80 bg-[#fbf6ef]/85 shadow-soft backdrop-blur-sm">
              <div className="grid grid-cols-3 divide-x divide-sunrise-100/80">
                <Stat
                  value={lostCount ?? 0}
                  label="Active Lost"
                />

                <Stat
                  value={foundCount ?? 0}
                  label="Active Found"
                />

                <Stat
                  value={recoveredCount ?? 0}
                  label="Reunited"
                  accent
                />
              </div>
            </div>
          </Reveal>

        </div>
      </section>

      {/* ====================================================================
          RECENT / LOCAL REPORTS
          ==================================================================== */}

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          {/* HEADER */}

          <Reveal>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-sunrise-700">
                  <Search size={14} />
                  Community reports
                </div>

                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
                  Recent reports
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                  See what people are reporting right now.
                </p>
              </div>

              <Link
                href="/search"
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-navy-200 hover:text-navy-800"
              >
                View all
                <ArrowRight size={15} />
              </Link>
            </div>
          </Reveal>

          {/* LOCAL ACTIVITY */}

          {localReports.length > 0 && (
            <Reveal delay={50}>
                            <div className="mt-7 rounded-3xl border border-sunrise-100/80 bg-[#fbf6ef]/90 p-4 shadow-soft sm:p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sunrise-100 text-sunrise-700">
                    <MapPin size={16} />
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-navy-900">
                      Latest local activity
                    </p>

                    <p className="text-xs text-slate-600">
                      Recently reported items with available locations
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {localReports.map((item) => (
                    <Link
                      key={`${item.kind}-local-${item.id}`}
                      href={item.href}
                      className="group rounded-xl border border-slate-200 bg-white/60 p-3 transition hover:border-navy-200 hover:bg-white"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider ${
                            item.kind === "lost"
                              ? "text-sunrise-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {item.kind}
                        </span>

                        <span className="text-[10px] text-slate-500">
                          {getRelativeDate(item.createdAt)}
                        </span>
                      </div>

                      <p className="mt-2 truncate text-sm font-medium text-navy-900 group-hover:text-navy-800">
                        {item.title}
                      </p>

                      <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin size={11} />
                        <span className="truncate">
                          {[item.city, item.province]
                            .filter(Boolean)
                            .join(", ") || "Location unavailable"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* REPORT FILTERS */}

          <Reveal delay={80}>
            <div className="mt-7 flex flex-wrap gap-2">
              <Link
                href="/lost"
                className="inline-flex items-center gap-2 rounded-full border border-sunrise-200 bg-sunrise-50 px-4 py-2 text-xs font-semibold text-sunrise-700 transition hover:bg-sunrise-100"
              >
                <PackageSearch size={13} />
                Lost
                <span className="text-sunrise-500/70">
                  {lostCount ?? 0}
                </span>
              </Link>

              <Link
                href="/found"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <HeartHandshake size={13} />
                Found
                <span className="text-emerald-500/70">
                  {foundCount ?? 0}
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
                <Reveal
                  key={`${item.kind}-${item.id}`}
                  delay={(index % 3) * 60}
                  className="h-full"
                >
                  <div className="relative h-full">
                    <div className="pointer-events-none absolute left-4 top-4 z-10">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
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
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyReports />
          )}
        </div>
      </section>

      <CommunityStories />

      {/* ====================================================================
          SAFETY
          ==================================================================== */}

      <section className="px-4 pb-16 pt-2 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="flex flex-col gap-4 rounded-3xl border border-electric-100/80 bg-white/90 p-5 shadow-soft sm:flex-row sm:items-center sm:p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-electric-200 bg-electric-50 text-electric-700">
                <ShieldCheck size={20} />
              </div>

              <div className="flex-1">
                <h3 className="text-sm font-semibold text-navy-900">
                  Keep your handover safe
                </h3>

                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Keep personal information private and choose a safe,
                  public place when meeting someone.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Lock size={13} />
                Privacy focused
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
    <div className="px-3 py-5 text-center sm:px-6 sm:py-6">
      <div
        className={`font-display text-2xl font-bold tabular-nums sm:text-3xl ${
          accent ? "text-emerald-600" : "text-navy-900"
        }`}
      >
        <AnimatedNumber value={Math.round(value)} />
      </div>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-600 sm:text-xs">
        {label}
      </p>
      </div>
    
  );
}

/* ============================================================================
   EMPTY STATE
   ============================================================================ */

function EmptyReports() {
  return (
    <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
        <Search size={20} />
      </div>

      <h3 className="mt-4 font-display text-lg font-semibold text-navy-900">
        No reports yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        Be the first to report a lost or found item in your community.
      </p>

      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Link
          href="/report/lost"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-electric-400"
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


