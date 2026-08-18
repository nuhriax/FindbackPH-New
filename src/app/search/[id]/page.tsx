import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getImagePublicUrl } from "@/lib/storage";
import { ReportDetail, type DetailItem, type DetailMatch } from "@/components/reports/report-detail";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const [lost, found] = await Promise.all([
    supabase.from("lost_items").select("title").eq("id", params.id).maybeSingle(),
    supabase.from("found_items").select("title").eq("id", params.id).maybeSingle(),
  ]);
  const title = lost.data?.title ?? found.data?.title;
  return {
    title: title ? `${title} — FindBack PH` : "Report — FindBack PH",
    description: "View a lost or found report on FindBack PH.",
  };
}

export default async function ReportDetailPage({ params }: Props) {
  const supabase = createClient();

  const [lostRes, foundRes] = await Promise.all([
    supabase
      .from("lost_items")
      .select("*, profiles!lost_items_reporter_id_fkey(username, successful_returns)")
      .eq("id", params.id)
      .maybeSingle(),
    supabase
      .from("found_items")
      .select("*, profiles!found_items_reporter_id_fkey(username, successful_returns)")
      .eq("id", params.id)
      .maybeSingle(),
  ]);

  const lost = lostRes.data as (Record<string, any> & { profiles?: any }) | null;
  const found = foundRes.data as (Record<string, any> & { profiles?: any }) | null;

  if (!lost && !found) notFound();

  const kind: "lost" | "found" = lost ? "lost" : "found";
  const raw = (lost ?? found) as Record<string, any>;
  const id = params.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user?.id === raw.reporter_id;
  const reporter = raw.profiles as { username: string; successful_returns: number } | null;

  const imageCol = kind === "lost" ? "lost_item_id" : "found_item_id";
  const { data: images } = await supabase
    .from("item_images")
    .select("storage_path, position")
    .eq(imageCol, id)
    .order("position", { ascending: true });

  const imageUrls = images?.map((img) => ({ url: getImagePublicUrl(img.storage_path) })) ?? [];

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
    />
  );
}

/** Supabase relation fields are typed as arrays in this hand-written schema. */
function firstRow<T>(value: T[] | T | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}