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
        <div className="absolute -left-48 -top-48 h-[34rem] w-[34rem] rounded-full bg-electric-500/[0.08] blur-3xl" />

        <div className="absolute -right-48 top-[20%] h-[30rem] w-[30rem] rounded-full bg-cyan-400/[0.05] blur-3xl" />

        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />
      </div>

      {/* ====================================================================
          HERO / SEARCH
          ==================================================================== */}

      <section className="px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:pt-20">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                <Search size={13} />
                FindBack PH
              </div>

              <h1 className="mt-6 font-display text-4xl font-bold leading-[1.04] tracking-tight text-navy-900 sm:text-5xl lg:text-6xl">
                Find what you lost.
                <br />
                <span className="gradient-text">
                  Return what you found.
                </span>
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
              <div className="group flex items-center rounded-2xl border border-slate-200/70 bg-white/90 p-2 shadow-soft ring-1 ring-slate-200/40 backdrop-blur-xl transition-all duration-300 focus-within:border-blue-300 focus-within:shadow-electric-500/[0.05]">
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
                  className="hidden shrink-0 items-center gap-2 rounded-xl bg-electric-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-electric-400 sm:flex"
                >
                  Search
                  <ArrowRight size={16} />
                </button>
              </div>

              <button
                type="submit"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-electric-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-electric-400 sm:hidden"
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

              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((category) => {
                  const Icon = category.icon;

                  return (
                    <Link
                      key={category.value}
                      href={`/search?category=${encodeURIComponent(
                        category.value
                      )}`}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
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
            <div className="mx-auto mt-7 grid max-w-3xl gap-3 sm:grid-cols-2">
              <Link
                href="/report/lost"
                className="group flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-100 text-indigo-600">
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
                  className="text-indigo-600 transition-transform group-hover:translate-x-1"
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
            <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur-sm">
              <div className="grid grid-cols-3 divide-x divide-slate-200/70">
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
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
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
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
              >
                View all
                <ArrowRight size={15} />
              </Link>
            </div>
          </Reveal>

          {/* LOCAL ACTIVITY */}

          {localReports.length > 0 && (
            <Reveal delay={50}>
              <div className="mt-7 rounded-2xl border border-slate-200/70 bg-white/70 p-4 backdrop-blur sm:p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
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
                      className="group rounded-xl border border-slate-200 bg-white/60 p-3 transition hover:border-blue-200 hover:bg-white"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider ${
                            item.kind === "lost"
                              ? "text-indigo-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {item.kind}
                        </span>

                        <span className="text-[10px] text-slate-500">
                          {getRelativeDate(item.createdAt)}
                        </span>
                      </div>

                      <p className="mt-2 truncate text-sm font-medium text-navy-900 group-hover:text-blue-700">
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
                className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                <PackageSearch size={13} />
                Lost
                <span className="text-indigo-500/70">
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
                            ? "border-indigo-200 bg-white/90 text-indigo-700"
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

      {/* ====================================================================
          SAFETY
          ==================================================================== */}

      <section className="px-4 pb-16 pt-2 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white/70 p-5 backdrop-blur sm:flex-row sm:items-center sm:p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700">
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
          accent ? "gradient-text" : "text-navy-900"
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


