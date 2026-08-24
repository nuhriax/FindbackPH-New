import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getImagePublicUrl, getSignedImageUrls } from "@/lib/storage";
import { computeMatchScore, MATCH_THRESHOLD } from "@/lib/matching-score";
import { ReportDetail, type DetailItem, type DetailMatch } from "@/components/reports/report-detail";
import { computeTrustSignals, isEmailVerified, isVerifiedReport, type OwnershipChallengeState } from "@/lib/trust";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: item } = await supabase
    .from("lost_items")
    .select("title, city, province, description")
    .eq("id", params.id)
    .maybeSingle();

  if (!item) {
    return { title: "Lost item — FindBack PH" };
  }

  const location = [item.city, item.province].filter(Boolean).join(", ");
  return {
    title: `${item.title} — Lost item · FindBack PH`,
    description: [
      item.description ?? "",
      location ? `Last seen in ${location}.` : "",
      "Reported on FindBack PH, the Philippines' lost & found community.",
    ]
      .filter(Boolean)
      .join(" "),
  };
}

/** Supabase relation fields are typed as arrays in this hand-written schema. */
function firstRow<T>(value: T[] | T | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export default async function LostItemDetailPage({ params }: Props) {
  const supabase = createClient();
  const id = params.id;

  const { data: raw } = await supabase
    .from("lost_items")
    .select("*, profiles!lost_items_reporter_id_fkey(username, first_name, last_name, successful_returns, created_at)")
    .eq("id", id)
    .maybeSingle();

  if (!raw) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user?.id === raw.reporter_id;
  const reporter = firstRow<{ username: string; first_name: string; last_name: string; successful_returns: number; created_at: string }>(raw.profiles);

  // Phase 7 — real trust signals only (see src/lib/trust.ts).
  const emailVerified = isEmailVerified(user);
  const trust = {
    ...computeTrustSignals({
      emailVerified,
      profileCreatedAt: reporter?.created_at ?? null,
      successfulReturns: reporter?.successful_returns ?? 0,
    }),
    // Set below, once imageUrls is known.
    verifiedReport: false,
  };

  // Phase 7 — ownership verification challenge state (questions + whether the
  // signed-in viewer already passed). Returns null when no challenge exists.
  const { data: challengeData } = user
    ? await supabase.rpc("get_ownership_challenge", {
        p_item_type: "lost_item",
        p_item_id: id,
      })
    : { data: null };
  const challenge = (challengeData ?? null) as OwnershipChallengeState | null;
  const ownership = challenge
    ? {
        itemType: "lost_item" as const,
        itemId: id,
        questions: {
          question1: challenge.question1,
          question2: challenge.question2 ?? null,
        },
        viewerPassed: Boolean(challenge.caller_passed),
      }
    : null;

  const { data: images } = await supabase
    .from("item_images")
    .select("id, storage_path, position")
    .eq("lost_item_id", id)
    .order("position", { ascending: true });

  const storedPaths = (images ?? []).map((img) => img.storage_path);
  const signedUrls = await getSignedImageUrls(storedPaths);
  const urlByPath = new Map(storedPaths.map((p, i) => [p, signedUrls[i]]));
  const imageUrls = (images ?? []).map((img) => ({
    id: img.id,
    url: urlByPath.get(img.storage_path) ?? getImagePublicUrl(img.storage_path),
  }));

  // Verified Report — only when the reporter is email-confirmed AND photos exist.
  trust.verifiedReport = isVerifiedReport(emailVerified, imageUrls.length);

  let savedItemId: string | null = null;
  if (user) {
    const { data: saved } = await supabase
      .from("saved_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("lost_item_id", id)
      .maybeSingle();
    savedItemId = saved?.id ?? null;
  }

  // Possible matches — found reports linked to this lost item.
  // RLS on `matches` only returns rows to the report owner / moderators.
  const matches: DetailMatch[] = [];
  const { data: matchRows } = await supabase
    .from("matches")
    .select("score, found_items(id, title, category, city, province)")
    .eq("lost_item_id", id);

  for (const m of matchRows ?? []) {
    const fi = firstRow<{
      id: string;
      title: string;
      category: string;
      city: string | null;
      province: string | null;
    }>(m.found_items as any);
    if (fi) {
      matches.push({
        id: fi.id,
        kind: "found",
        title: fi.title,
        category: fi.category,
        city: fi.city,
        province: fi.province,
        score: m.score,
      });
    }
  }

  // Live fallback: also compute candidates that were never stored in the
  // `matches` table (e.g. reports posted before the engine ran, or a failed
  // matching run). Uses the exact same real scoring algorithm — no invented
  // scores. Only computed for active lost items; capped to keep queries light.
  if (raw.status === "active" && user?.id === raw.reporter_id) {
    const knownIds = new Set(matches.map((m) => m.id));
    const { data: candidates } = await supabase
      .from("found_items")
      .select("id, title, category, city, province, date_found, description, distinguishing_features, approximate_location")
      .eq("status", "active");

    const liveMatches = (candidates ?? [])
      .filter((c) => !knownIds.has(c.id))
      .map((c) => ({
        candidate: c,
        score: computeMatchScore(
          {
            category: raw.category,
            id: raw.id,
            city: raw.city ?? null,
            province: raw.province ?? null,
            approximate_location: raw.approximate_location ?? null,
            date_lost: raw.date_lost ?? null,
            title: raw.title,
            description: raw.description ?? "",
            distinguishing_features: raw.distinguishing_features ?? null,
          },
          {
            category: c.category,
            id: c.id,
            city: c.city ?? null,
            province: c.province ?? null,
            approximate_location: c.approximate_location ?? null,
            date_found: c.date_found ?? null,
            title: c.title,
            description: c.description ?? "",
            distinguishing_features: c.distinguishing_features ?? null,
          },
        ),
      }))
      .filter((m) => m.score > MATCH_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    for (const lm of liveMatches) {
      const fi = lm.candidate;
      matches.push({
        id: fi.id,
        kind: "found",
        title: fi.title,
        category: fi.category,
        city: fi.city,
        province: fi.province,
        score: Math.round(lm.score * 100) / 100,
      });
    }

    // Highest-scoring first across stored + live matches.
    matches.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  const item: DetailItem = {
    id,
    title: raw.title,
    category: raw.category,
    description: raw.description,
    distinguishingFeatures: raw.distinguishing_features ?? null,
    city: raw.city ?? null,
    province: raw.province ?? null,
    approximateLocation: raw.approximate_location ?? null,
    status: raw.status,
    createdAt: raw.created_at ?? null,
    dateLabel: raw.date_lost
      ? format(new Date(raw.date_lost), "MMM d, yyyy")
      : "recently",
    reward: raw.reward_amount ?? null,
    dateOccurred: raw.date_lost ?? null,
    reporterId: raw.reporter_id,
  };

  return (
    <ReportDetail
      kind="lost"
      item={item}
      images={imageUrls}
      reporter={reporter}
      trust={trust}
      ownership={ownership}
      isOwner={isOwner}
      savedItemId={savedItemId}
      matches={matches}
      backHref="/lost"
      backLabel="Back to lost items"
      matchHref={(matchId) => `/found/${matchId}`}
    />
  );
}