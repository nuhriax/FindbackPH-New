import type { TrustSignals } from "@/lib/trust";

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
  /** Phase 12 — enables "Report this user" against the listing's reporter. */
  reporterId?: string | null;
  /** Public view counter ("👁 N views"); null hides the pill (migration 104 not run). */
  viewCount?: number | null;
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

export type SimilarItem = {
  id: string;
  kind: "lost" | "found";
  title: string;
  category: string;
  city: string | null;
  province: string | null;
  createdAt: string | null;
  /** First photo, if the report has one (already a usable URL). */
  imageUrl?: string | null;
};

export type ReporterSummary = {
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  successful_returns: number;
};

export type DetailTrustSignals =
  | (TrustSignals & { verifiedReport: boolean })
  | null;
