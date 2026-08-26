import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  EditReportForm,
  type EditableReport,
  type EditPhoto,
} from "@/components/reports/edit-report-form";
import { getImagePublicUrl, getSignedImageUrls } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: reportId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [lostRes, foundRes] = await Promise.all([
    supabase.from("lost_items").select("*").eq("id", reportId).maybeSingle(),
    supabase.from("found_items").select("*").eq("id", reportId).maybeSingle(),
  ]);

  const lost = lostRes.data as Record<string, any> | null;
  const found = foundRes.data as Record<string, any> | null;

  if (!lost && !found) notFound();

  const kind = lost ? "lost_item" : "found_item";
  const item = (lost ?? found) as Record<string, any>;

  // Ownership enforced server-side — a non-owner simply never sees this page.
  if (item.reporter_id !== user.id) notFound();

  // Existing photos so they can be removed inline while editing.
  const imageCol = lost ? "lost_item_id" : "found_item_id";
  const { data: images } = await supabase
    .from("item_images")
    .select("id, storage_path")
    .eq(imageCol, reportId)
    .order("position", { ascending: true });

  const storedPaths = (images ?? []).map((img) => img.storage_path);
  const signedUrls = await getSignedImageUrls(storedPaths);
  const urlByPath = new Map(storedPaths.map((p, i) => [p, signedUrls[i]]));
  const photos: EditPhoto[] = (images ?? []).map((img) => ({
    id: img.id,
    url: urlByPath.get(img.storage_path) ?? getImagePublicUrl(img.storage_path),
  }));

  const dateVal =
    kind === "lost_item" ? (item.date_lost as string) : (item.date_found as string);

  const editable: EditableReport = {
    id: reportId,
    title: item.title,
    category: item.category,
    description: item.description,
    distinguishingFeatures: item.distinguishing_features ?? null,
    city: item.city ?? "",
    province: item.province ?? "",
    approximateLocation: item.approximate_location ?? null,
    dateString: dateVal ? String(dateVal).slice(0, 10) : "",
    reward: kind === "lost_item" ? (item.reward_amount ?? null) : null,
    holdingInfo: kind === "found_item" ? (item.current_holding_info ?? null) : null,
  };

  return (
    <div>
      <span className="section-eyebrow">Your report</span>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-navy-900">
        Edit report
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
        Update the details of your {kind === "lost_item" ? "lost" : "found"} item report.
      </p>

      <div className="mt-8">
        <EditReportForm kind={kind} item={editable} images={photos} />
      </div>
    </div>
  );
}