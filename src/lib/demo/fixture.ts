import type { ItemCategory } from "@/types/database";
import type { FeedItem } from "@/lib/discover/query";
import type { MapPoint } from "@/components/map/philippines-map-impl";
import type { DetailItem, ReporterSummary } from "@/components/reports/report-detail-types";
import type { HeroCard } from "@/components/home/hero";
import type { FeedCard } from "@/components/home/feed-tabs";

/**
 * Demo fixture — presentation-only sample reports.
 *
 * Every title below is deliberately prefixed "Demo:" so no viewer can mistake
 * a sample report for a real community post (ANTI_SLOP: never fabricate real
 * community activity). Coordinates are approximate city-center points; photos
 * are locally generated demo assets under /demo/ (public). Nothing here is
 * ever written to the database — this file is data, not state.
 */

export type DemoReport = {
  id: string;
  kind: "lost" | "found";
  title: string;
  category: ItemCategory;
  city: string;
  province: string;
  description: string;
  /** Hours ago the report was posted (drives created_at + relative labels). */
  hoursAgo: number;
  lat: number;
  lng: number;
  /** Public demo photo under /demo/ (generated placeholder, labeled). */
  photo: string | null;
  /** Lost reports only. */
  reward?: number;
};

export const DEMO_REPORTS: DemoReport[] = [
  {
    id: "demo-lost-iphone-13",
    kind: "lost",
    title: "Demo: iPhone 13 (black) left on a jeep",
    category: "phones",
    city: "Baliuag",
    province: "Bulacan",
    description:
      "Naiwan ko po sa jeep papuntang Baliuag terminal, malapit sa wet market. Black iPhone 13, may clear case at screen protector sa gilid. Lock screen photo is a beach sunset.",
    hoursAgo: 3,
    lat: 14.954,
    lng: 120.89,
    photo: "/demo/iphone-lost.png",
    reward: 1000,
  },
  {
    id: "demo-found-iphone-13",
    kind: "found",
    title: "Demo: iPhone found near Baliuag terminal",
    category: "phones",
    city: "Baliuag",
    province: "Bulacan",
    description:
      "Nakapulot po sa bus stop malapit sa Baliuag public terminal, mga 7am. Black iPhone, naka-off. Keeping it safe — para sa tunay na may-ari.",
    hoursAgo: 1,
    lat: 14.9565,
    lng: 120.8947,
    photo: "/demo/iphone-found.png",
  },
  {
    id: "demo-lost-wallet",
    kind: "lost",
    title: "Demo: navy wallet with school ID",
    category: "wallets",
    city: "San Fernando",
    province: "Pampanga",
    description:
      "Brown-navy bifold wallet, lost sa palengke area sa downtown. May school ID sa loob at about PHP 500 cash. Reward for an honest return.",
    hoursAgo: 26,
    lat: 15.039,
    lng: 120.686,
    photo: null,
    reward: 500,
  },
  {
    id: "demo-found-keys",
    kind: "found",
    title: "Demo: set of keys with a carabiner",
    category: "keys",
    city: "Malolos",
    province: "Bulacan",
    description:
      "Nakapulot na set ng susi malapit sa Malolos cathedral, may carabiner. Nakaturn over na sa guard after walang nag-claim by Sunday.",
    hoursAgo: 50,
    lat: 14.843,
    lng: 120.813,
    photo: null,
  },
  {
    id: "demo-found-glasses",
    kind: "found",
    title: "Demo: eyeglasses in a brown case",
    category: "other",
    city: "Angeles City",
    province: "Pampanga",
    description:
      "Found sa jeepney stop — prescription eyeglasses sa isang brown hard case. Presumably left by a passenger last night.",
    hoursAgo: 9,
    lat: 15.145,
    lng: 120.588,
    photo: null,
  },
  {
    id: "demo-lost-backpack",
    kind: "lost",
    title: "Demo: black Jansport backpack",
    category: "bags",
    city: "Quezon City",
    province: "Metro Manila",
    description:
      "Naiwan sa MRT North Avenue station bench, black Jansport, may name tag sa loob na 'Miguel'. Contains notebooks lang — please return lang po.",
    hoursAgo: 74,
    lat: 14.651,
    lng: 121.036,
    photo: null,
  },
];

/* ------------------------------------------------------------------ */
/* Reporters — fictional demo aliases (no real people implied).        */
/* ------------------------------------------------------------------ */

export const DEMO_REPORTERS: Record<string, ReporterSummary> = {
  "demo-lost-iphone-13": {
    username: "demo-miguel",
    first_name: "Miguel",
    last_name: "Reyes",
    successful_returns: 0,
  },
  "demo-found-iphone-13": {
    username: "demo-andrea",
    first_name: "Andrea",
    last_name: "Santos",
    successful_returns: 0,
  },
  "demo-lost-wallet": {
    username: "demo-liza",
    first_name: "Liza",
    last_name: "Manalo",
    successful_returns: 0,
  },
  "demo-found-keys": {
    username: "demo-ben",
    first_name: "Ben",
    last_name: "Dizon",
    successful_returns: 0,
  },
  "demo-found-glasses": {
    username: "demo-cora",
    first_name: "Cora",
    last_name: "Villanueva",
    successful_returns: 0,
  },
  "demo-lost-backpack": {
    username: "demo-miguel",
    first_name: "Miguel",
    last_name: "Reyes",
    successful_returns: 0,
  },
};

/* ------------------------------------------------------------------ */
/* Relative label — same guard rules as the real homepage formatter.   */
/* ------------------------------------------------------------------ */

export function demoDateLabel(hoursAgo: number): string {
  if (hoursAgo < 1) return "Just now";
  if (hoursAgo === 1) return "1h ago";
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  const days = Math.round(hoursAgo / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

export function demoCreatedAt(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 3_600_000).toISOString();
}

/* ------------------------------------------------------------------ */
/* Shape mappers — demo reports rendered through the REAL components.  */
/* ------------------------------------------------------------------ */

export function demoFeedItems(): FeedItem[] {
  return DEMO_REPORTS.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    category: r.category,
    city: r.city,
    province: r.province,
    description: r.description,
    created_at: demoCreatedAt(r.hoursAgo),
    view_count: null,
    latitude: r.lat,
    longitude: r.lng,
    reward_amount: r.kind === "lost" ? (r.reward ?? null) : null,
    href: `/demo/${r.kind}/${r.id}`,
  }));
}

export function demoImageMap(): Map<string, string> {
  return new Map(
    DEMO_REPORTS.filter((r) => r.photo).map((r) => [r.id, r.photo as string])
  );
}

export function demoMapPoints(): MapPoint[] {
  return DEMO_REPORTS.map((r) => ({
    id: r.id,
    kind: r.kind,
    lat: r.lat,
    lng: r.lng,
    title: r.title,
    city: r.city,
    province: r.province,
    href: `/demo/${r.kind}/${r.id}`,
    date: demoCreatedAt(r.hoursAgo),
  }));
}

export function demoHeroCards(): HeroCard[] {
  return DEMO_REPORTS.map((r) => ({
    id: r.id,
    title: r.title,
    kind: r.kind,
    city: r.city,
    province: r.province,
    description: r.description,
    category: r.category,
    dateLabel: demoDateLabel(r.hoursAgo),
    imageUrl: r.photo,
  }));
}

export function demoFeedCards(): FeedCard[] {
  return DEMO_REPORTS.map((r) => ({
    id: r.id,
    href: `/demo/${r.kind}/${r.id}`,
    title: r.title,
    category: r.category,
    city: r.city,
    province: r.province,
    description: r.description,
    dateLabel: demoDateLabel(r.hoursAgo),
    kind: r.kind,
    imageUrl: r.photo,
    reward: r.kind === "lost" ? (r.reward ?? null) : null,
  }));
}

/* ------------------------------------------------------------------ */
/* Detail — one demo report rendered through the real ReportDetail.    */
/* ------------------------------------------------------------------ */

export type DemoDetail = {
  item: DetailItem;
  images: { id: string; url: string }[];
  reporter: ReporterSummary;
  reporterName: string;
};

export function getDemoDetail(
  kind: "lost" | "found",
  id: string
): DemoDetail | null {
  const report = DEMO_REPORTS.find((r) => r.id === id && r.kind === kind);
  if (!report) return null;

  const reporter = DEMO_REPORTERS[report.id];
  const item: DetailItem = {
    id: report.id,
    title: report.title,
    category: report.category,
    color: null,
    description: report.description,
    distinguishingFeatures: null,
    city: report.city,
    province: report.province,
    approximateLocation: null,
    status: "active",
    createdAt: demoCreatedAt(report.hoursAgo),
    dateLabel: demoDateLabel(report.hoursAgo),
    reward: report.kind === "lost" ? (report.reward ?? null) : null,
    reporterId: null,
    viewCount: null,
  };

  return {
    item,
    images: report.photo ? [{ id: `${report.id}-img`, url: report.photo }] : [],
    reporter,
    reporterName: [reporter.first_name, reporter.last_name]
      .filter(Boolean)
      .join(" "),
  };
}

