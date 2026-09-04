import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getImagePublicUrl, getSignedImageUrls } from "@/lib/storage";
import { computeMatchScore, MATCH_THRESHOLD } from "@/lib/matching-score";
import { ReportDetail, type DetailItem, type DetailMatch, type SimilarItem } from "@/components/reports/report-detail";
import { Breadcrumbs } from "@/components/breadcrumbs";
import type { ReportViewer } from "@/components/reports/report-viewers";
import { computeTrustSignals, isEmailVerified, isVerifiedReport, type OwnershipChallengeState } from "@/lib/trust";
import { jsonLdStringify } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("lost_items")
    .select("title, city, province, description")
    .eq("id", id)
    .maybeSingle();

  if (!item) {
    return { title: "Lost item — FindBack PH" };
  }

  const location = [item.city, item.province].filter(Boolean).join(", ");
  const description = [
    item.description ?? "",
    location ? `Last seen in ${location}.` : "",
    "Reported on FindBack PH, the Philippines' lost & found community.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title: `${item.title} — Lost item · FindBack PH`,
    description,
    alternates: { canonical: `/lost/${id}` },
    openGraph: {
      title: `${item.title} — Lost item · FindBack PH`,
      description,
      type: "website",
      url: `/lost/${id}`,
      siteName: "FindBack PH",
      locale: "en_PH",
    },
    twitter: {
      card: "summary",
      title: `${item.title} — Lost item · FindBack PH`,
      description,
    },
  };
}

/** Supabase relation fields are typed as arrays in this hand-written schema. */
function firstRow<T>(value: T[] | T | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export default async function LostItemDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { id } = await params;

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

  // Owner-only viewer list ( SECURITY DEFINER RPC enforces ownership; returns
  // empty rows for everyone else, so a failed fetch just hides the panel).
  let viewers: ReportViewer[] | null = null;
  if (isOwner) {
    const { data: viewerRows } = await supabase.rpc("get_item_viewers", {
      p_item_type: "lost_item",
      p_item_id: id,
    });
    viewers = (viewerRows ?? []).map((row) => ({
      displayName: row.display_name ?? "Someone",
      username: row.username,
      avatarUrl: row.avatar_url,
      isMember: row.is_member,
      viewedAt: row.viewed_at,
    }));
  }

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

  // PRIVATE — verification details live in the owner-only item_private_details
  // table (supabase/110-trust-safety.sql). RLS returns null for non-owners, so
  // private text never reaches the client for anyone but the reporter.
  const { data: privateRow } = await supabase
    .from("item_private_details")
    .select("details")
    .eq("item_type", "lost_item")
    .eq("item_id", id)
    .maybeSingle();
  const privateFeatures = isOwner ? privateRow?.details ?? null : null;

  // Trust & Safety (110) — two-sided return confirmation state. Only signed-in
  // participants (reporter or conversation party) get a non-null state.
  let returnConfirm: {
    canConfirm: boolean;
    viewerConfirmed: boolean;
    reporterConfirmed: boolean;
    total: number;
    status: string;
  } | null = null;
  if (user) {
    const { data: confirmations } = await supabase
      .from("return_confirmations")
      .select("user_id")
      .eq("item_type", "lost_item")
      .eq("item_id", id);

    const total = (confirmations ?? []).length;
    if (total > 0 || isOwner) {
      const { data: convo } = await supabase
        .from("conversations")
        .select("id")
        .eq("item_type", "lost_item")
        .eq("item_id", id)
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
        .limit(1)
        .maybeSingle();

      const canConfirm = isOwner || Boolean(convo);
      if (canConfirm) {
        returnConfirm = {
          canConfirm,
          viewerConfirmed: (confirmations ?? []).some((c) => c.user_id === user.id),
          reporterConfirmed: (confirmations ?? []).some(
            (c) => c.user_id === raw.reporter_id,
          ),
          total,
          status: raw.status,
        };
      }
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

    // PRIVATE — candidate features for scoring, server-side only (110).
    const candidateIds = (candidates ?? []).map((c) => c.id);
    const candidateFeatures = new Map<string, string | null>();
    if (candidateIds.length > 0) {
      try {
        const service = createServiceRoleClient();
        const { data: privateRows } = await service
          .from("item_private_details")
          .select("item_id, details")
          .eq("item_type", "found_item")
          .in("item_id", candidateIds);
        for (const r of privateRows ?? []) {
          candidateFeatures.set(r.item_id, r.details);
        }
      } catch (e) {
        console.error("Candidate private features fetch error:", e);
      }
    }

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
            distinguishing_features: privateFeatures,
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
            distinguishing_features: candidateFeatures.get(c.id) ?? null,
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

  // Similar reports — other ACTIVE lost items with the same category. Same
  // province is ranked first; one thumbnail each, capped at 4 cards.
  const similarItems: SimilarItem[] = [];
  {
    const { data: similarRows } = await supabase
      .from("lost_items")
      .select("id, title, category, city, province, created_at")
      .eq("status", "active")
      .eq("category", raw.category)
      .neq("id", id)
      .order("created_at", { ascending: false })
      .limit(12);

    const ranked = (similarRows ?? [])
      .sort(
        (a, b) =>
          Number(b.province === raw.province) -
          Number(a.province === raw.province),
      )
      .slice(0, 4);

    if (ranked.length > 0) {
      const ids = ranked.map((r) => r.id);
      const { data: thumbs } = await supabase
        .from("item_images")
        .select("lost_item_id, storage_path, position")
        .in("lost_item_id", ids)
        .order("position", { ascending: true });

      const firstByItem = new Map<string, string>();
      for (const t of thumbs ?? []) {
        if (t.lost_item_id && !firstByItem.has(t.lost_item_id)) {
          firstByItem.set(t.lost_item_id, t.storage_path);
        }
      }

      const paths = ranked
        .map((r) => firstByItem.get(r.id))
        .filter(Boolean) as string[];
      const urls = await getSignedImageUrls(paths);
      const urlByPath = new Map(paths.map((p, i) => [p, urls[i]]));

      for (const r of ranked) {
        const p = firstByItem.get(r.id);
        similarItems.push({
          id: r.id,
          kind: "lost",
          title: r.title,
          category: r.category,
          city: r.city ?? null,
          province: r.province ?? null,
          createdAt: r.created_at ?? null,
          imageUrl: p ? (urlByPath.get(p) ?? getImagePublicUrl(p)) : null,
        });
      }
    }
  }

  const item: DetailItem = {
    id,
    title: raw.title,
    category: raw.category,
    description: raw.description,
    distinguishingFeatures: privateFeatures,
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
    viewCount: raw.view_count ?? null,
  };

  const locationText = [raw.city, raw.province].filter(Boolean).join(", ");
  const schemaDescription = raw.description ?? "";

  return (
    <>
      {/* Structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdStringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: `${raw.title} — Lost item · FindBack PH`,
            url: `/lost/${id}`,
            description:
              schemaDescription +
              (locationText ? ` Last seen in ${locationText}.` : ""),
            about: {
              "@type": "Thing",
              name: raw.title,
              description: schemaDescription,
              ...(locationText
                ? {
                    additionalProperty: {
                      "@type": "PropertyValue",
                      name: "location",
                      value: locationText,
                    },
                  }
                : {}),
            },
          }),
        }}
      />

      <div className="mx-auto w-full max-w-[1380px] px-4 pt-5 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "Discover", href: "/discover" },
            { label: "Lost items", href: "/lost" },
            { label: raw.title },
          ]}
        />
      </div>

      <ReportDetail
        kind="lost"
        item={item}
        images={imageUrls}
        reporter={reporter}
        trust={trust}
        ownership={ownership}
        returnConfirm={returnConfirm}
        isOwner={isOwner}
        savedItemId={savedItemId}
        matches={matches}
        similarItems={similarItems}
        viewers={viewers}
        backHref="/lost"
        backLabel="Back to lost items"
        matchHref={(matchId) => `/found/${matchId}`}
      />
    </>
  );
}