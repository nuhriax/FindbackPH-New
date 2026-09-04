import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getImagePublicUrl, getSignedImageUrls } from "@/lib/storage";
import { ReportDetail, type DetailItem, type DetailMatch, type SimilarItem } from "@/components/reports/report-detail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const [lost, found] = await Promise.all([
    supabase.from("lost_items").select("title").eq("id", id).maybeSingle(),
    supabase.from("found_items").select("title").eq("id", id).maybeSingle(),
  ]);
  const title = lost.data?.title ?? found.data?.title;
  return {
    title: title ? `${title} — FindBack PH` : "Report — FindBack PH",
    description: "View a lost or found report on FindBack PH.",
  };
}

export default async function ReportDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [lostRes, foundRes] = await Promise.all([
    supabase
      .from("lost_items")
      .select("*, profiles!lost_items_reporter_id_fkey(username, first_name, last_name, successful_returns)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("found_items")
      .select("*, profiles!found_items_reporter_id_fkey(username, first_name, last_name, successful_returns)")
      .eq("id", id)
      .maybeSingle(),
  ]);

  const lost = lostRes.data as (Record<string, any> & { profiles?: any }) | null;
  const found = foundRes.data as (Record<string, any> & { profiles?: any }) | null;

  if (!lost && !found) notFound();

  const kind: "lost" | "found" = lost ? "lost" : "found";
  const raw = (lost ?? found) as Record<string, any>;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user?.id === raw.reporter_id;
  const reporter = raw.profiles as {
    username: string;
    first_name?: string;
    last_name?: string;
    successful_returns: number;
  } | null;

  const imageCol = kind === "lost" ? "lost_item_id" : "found_item_id";
  const { data: images } = await supabase
    .from("item_images")
    .select("id, storage_path, position")
    .eq(imageCol, id)
    .order("position", { ascending: true });

  const storedPaths = (images ?? []).map((img) => img.storage_path);
  const signedUrls = await getSignedImageUrls(storedPaths);
  const urlByPath = new Map(storedPaths.map((p, i) => [p, signedUrls[i]]));
  const imageUrls = (images ?? []).map((img) => ({
    id: img.id,
    url: urlByPath.get(img.storage_path) ?? getImagePublicUrl(img.storage_path),
  })) as { id: string; url: string }[];

  let savedItemId: string | null = null;
  if (user) {
    const col = kind === "lost" ? "lost_item_id" : "found_item_id";
    const { data: saved } = await supabase
      .from("saved_items")
      .select("id")
      .eq("user_id", user.id)
      .eq(col, id)
      .maybeSingle();
    savedItemId = saved?.id ?? null;
  }

  // Possible matches
  let matches: DetailMatch[] = [];
  if (kind === "lost") {
    const { data } = await supabase
      .from("matches")
      .select("score, found_items(id, title, category, city, province)")
      .eq("lost_item_id", id);
    for (const m of data ?? []) {
      const fi = firstRow<{ id: string; title: string; category: string; city: string | null; province: string | null }>(m.found_items as any);
      if (fi) {
        matches.push({ id: fi.id, kind: "found", title: fi.title, category: fi.category, city: fi.city, province: fi.province, score: m.score });
      }
    }
  } else {
    const { data } = await supabase
      .from("matches")
      .select("score, lost_items(id, title, category, city, province)")
      .eq("found_item_id", id);
    for (const m of data ?? []) {
      const li = firstRow<{ id: string; title: string; category: string; city: string | null; province: string | null }>(m.lost_items as any);
      if (li) {
        matches.push({ id: li.id, kind: "lost", title: li.title, category: li.category, city: li.city, province: li.province, score: m.score });
      }
    }
  }

  // Similar reports — other ACTIVE reports with the same category. Same
  // province is ranked first; one thumbnail each, capped at 4 cards.
  const similarItems: SimilarItem[] = [];
  {
    const table = kind === "lost" ? "lost_items" : "found_items";
    const imgCol = kind === "lost" ? "lost_item_id" : "found_item_id";

    const { data: similarRows } = await supabase
      .from(table)
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
        .select(`${imgCol}, storage_path, position`)
        .in(imgCol, ids)
        .order("position", { ascending: true });

      type ThumbRow = Record<string, string | number | null>;

      const firstByItem = new Map<string, string>();
      for (const t of (thumbs ?? []) as unknown as ThumbRow[]) {
        const itemId = t[imgCol] as string | null;
        if (itemId && !firstByItem.has(itemId)) {
          firstByItem.set(itemId, String(t.storage_path));
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
          kind,
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

  const dateVal = kind === "lost" ? raw.date_lost : raw.date_found;
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
    dateLabel: dateVal ? format(new Date(dateVal), "MMM d, yyyy") : "recently",
    reward: raw.reward_amount ?? null,
    dateOccurred: dateVal ?? null,
    holdingInfo: raw.current_holding_info ?? null,
    reporterId: raw.reporter_id,
    viewCount: raw.view_count ?? null,
  };

  return (
    <ReportDetail
      kind={kind}
      item={item}
      images={imageUrls}
      reporter={reporter}
      isOwner={isOwner}
      savedItemId={savedItemId}
      matches={matches}
      similarItems={similarItems}
    />
  );
}

/** Supabase relation fields are typed as arrays in this hand-written schema. */
function firstRow<T>(value: T[] | T | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}