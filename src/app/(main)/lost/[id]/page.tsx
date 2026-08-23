import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getImagePublicUrl, getSignedImageUrls } from "@/lib/storage";
import { ReportDetail, type DetailItem, type DetailMatch } from "@/components/reports/report-detail";

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
    .select("*, profiles!lost_items_reporter_id_fkey(username, successful_returns)")
    .eq("id", id)
    .maybeSingle();

  if (!raw) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user?.id === raw.reporter_id;
  const reporter = firstRow<{ username: string; successful_returns: number }>(raw.profiles);

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
  };

  return (
    <ReportDetail
      kind="lost"
      item={item}
      images={imageUrls}
      reporter={reporter}
      isOwner={isOwner}
      savedItemId={savedItemId}
      matches={matches}
      backHref="/lost"
      backLabel="Back to lost items"
      matchHref={(matchId) => `/found/${matchId}`}
    />
  );
}