import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getImagePublicUrl, getSignedImageUrls } from "@/lib/storage";
import { ReportDetail, type DetailItem, type DetailMatch } from "@/components/reports/report-detail";
import { computeTrustSignals, isEmailVerified, isVerifiedReport, type OwnershipChallengeState } from "@/lib/trust";
import { jsonLdStringify } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type Reporter = {
  username: string;
  first_name?: string;
  last_name?: string;
  successful_returns: number;
  created_at?: string;
};

type LostItem = {
  id: string;
  title: string;
  category: string;
  city: string | null;
  province: string | null;
};

function firstRow<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("found_items")
    .select("title, city, province, description")
    .eq("id", id)
    .maybeSingle();

  if (!item) {
    return {
      title: "Found item — FindBack PH",
    };
  }

  const location = [item.city, item.province].filter(Boolean).join(", ");

  const description = [
    item.description ?? "",
    location && `Found in ${location}.`,
    "Reported on FindBack PH, the Philippines' lost & found community.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title: `${item.title} — Found item · FindBack PH`,
    description,
    alternates: { canonical: `/found/${id}` },
    openGraph: {
      title: `${item.title} — Found item · FindBack PH`,
      description,
      type: "website",
      url: `/found/${id}`,
      siteName: "FindBack PH",
      locale: "en_PH",
    },
    twitter: {
      card: "summary",
      title: `${item.title} — Found item · FindBack PH`,
      description,
    },
  };
}

export default async function FoundItemDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { id } = await params;

  // Fetch the main item first because everything else depends on it.
  const { data: raw, error: itemError } = await supabase
    .from("found_items")
    .select(`
      *,
      profiles!found_items_reporter_id_fkey (
        username,
        first_name,
        last_name,
        successful_returns,
        created_at
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (itemError) {
    console.error("Failed to fetch found item:", itemError);
  }

  if (!raw) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user?.id === raw.reporter_id;

  const reporter = firstRow<Reporter>(raw.profiles);

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

  // Phase 7 — ownership verification challenge state. Null when none exists.
  const { data: challengeData } = user
    ? await supabase.rpc("get_ownership_challenge", {
        p_item_type: "found_item",
        p_item_id: id,
      })
    : { data: null };
  const challenge = (challengeData ?? null) as OwnershipChallengeState | null;
  const ownership = challenge
    ? {
        itemType: "found_item" as const,
        itemId: id,
        questions: {
          question1: challenge.question1 as string,
          question2: (challenge.question2 as string | null) ?? null,
        },
        viewerPassed: Boolean(challenge.caller_passed),
      }
    : null;

  /*
   * These queries are independent, so run them concurrently.
   */
  const [
    { data: images, error: imagesError },
    { data: matchRows, error: matchesError },
    savedResult,
  ] = await Promise.all([
    supabase
      .from("item_images")
      .select("id, storage_path, position")
      .eq("found_item_id", id)
      .order("position", { ascending: true }),

    supabase
      .from("matches")
      .select(`
        score,
        lost_items (
          id,
          title,
          category,
          city,
          province
        )
      `)
      .eq("found_item_id", id),

    user
      ? supabase
          .from("saved_items")
          .select("id")
          .eq("user_id", user.id)
          .eq("found_item_id", id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (imagesError) {
    console.error("Failed to fetch item images:", imagesError);
  }

  if (matchesError) {
    console.error("Failed to fetch item matches:", matchesError);
  }

  if (savedResult.error) {
    console.error("Failed to fetch saved item:", savedResult.error);
  }

  const storedPaths = (images ?? []).map((img) => img.storage_path);
  const signedUrls = await getSignedImageUrls(storedPaths);
  const urlByPath = new Map(storedPaths.map((p, i) => [p, signedUrls[i]]));
  const imageUrls = (images ?? []).map(({ id, storage_path }) => ({
    id,
    url: urlByPath.get(storage_path) ?? getImagePublicUrl(storage_path),
  })) as { id: string; url: string }[];

  const savedItemId = savedResult.data?.id ?? null;

  // Verified Report — only when the reporter is email-confirmed AND photos exist.
  trust.verifiedReport = isVerifiedReport(emailVerified, imageUrls.length);

  const matches: DetailMatch[] = [];

  for (const match of matchRows ?? []) {
    const lostItem = firstRow<LostItem>(match.lost_items);

    if (!lostItem) continue;

    matches.push({
      id: lostItem.id,
      kind: "lost",
      title: lostItem.title,
      category: lostItem.category,
      city: lostItem.city,
      province: lostItem.province,
      score: match.score,
    });
  }

  const item: DetailItem = {
    id,
    title: raw.title,
    category: raw.category,
    description: raw.description ?? null,
    distinguishingFeatures: raw.distinguishing_features ?? null,
    city: raw.city ?? null,
    province: raw.province ?? null,
    approximateLocation: raw.approximate_location ?? null,
    status: raw.status,
    createdAt: raw.created_at ?? null,
    dateLabel: raw.date_found
      ? format(new Date(raw.date_found), "MMM d, yyyy")
      : "Recently",
    reward: null,
    dateOccurred: raw.date_found ?? null,
    holdingInfo: raw.current_holding_info ?? null,
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
            name: `${raw.title} — Found item · FindBack PH`,
            url: `/found/${id}`,
            description:
              schemaDescription +
              (locationText ? ` Found in ${locationText}.` : ""),
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

      <ReportDetail
        kind="found"
        item={item}
        images={imageUrls}
        reporter={reporter}
        trust={trust}
        ownership={ownership}
        isOwner={isOwner}
        savedItemId={savedItemId}
        matches={matches}
        backHref="/found"
        backLabel="Back to found items"
        matchHref={(matchId) => `/lost/${matchId}`}
      />
    </>
  );
}