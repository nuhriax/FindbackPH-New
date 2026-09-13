import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSavedItems } from "@/lib/actions/items";
import { Bookmark, MapPin, PackageCheck, PackageX } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/validation";
import { RemoveSavedButton } from "@/components/saved/remove-saved-button";
import { getSignedImageUrls } from "@/lib/storage";

export const dynamic = "force-dynamic";

const STATUS_TONES: Record<string, string> = {
  active: "border-electric-200 bg-electric-50 text-electric-700",
  matched: "border-amber-200 bg-amber-50 text-amber-700",
  recovered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived: "border-slate-200 bg-slate-100 text-slate-600",
  removed: "border-red-200 bg-red-50 text-red-600",
};

function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONES[status] ?? "border-slate-200 bg-slate-100 text-slate-700";
  const label = status === "recovered" ? "Returned" : status;
  return <span className={`rounded-full border px-2 py-0.5 text-xs capitalize ${tone}`}>{label}</span>;
}

export default async function DashboardSavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const savedItems = await getUserSavedItems();

  /* Fetch the first photo of every saved item for thumbnails */
  const lostIds = savedItems
    .map((s) => s.lost_item_id)
    .filter((id): id is string => Boolean(id));
  const foundIds = savedItems
    .map((s) => s.found_item_id)
    .filter((id): id is string => Boolean(id));

  const [lostImageRes, foundImageRes] = await Promise.all([
    lostIds.length
      ? supabase
          .from("item_images")
          .select("lost_item_id, storage_path")
          .in("lost_item_id", lostIds)
          .eq("position", 0)
      : Promise.resolve({ data: null }),
    foundIds.length
      ? supabase
          .from("item_images")
          .select("found_item_id, storage_path")
          .in("found_item_id", foundIds)
          .eq("position", 0)
      : Promise.resolve({ data: null }),
  ]);

  const lostPaths = (lostImageRes.data ?? []) as Array<{ lost_item_id: string; storage_path: string }>;
  const foundPaths = (foundImageRes.data ?? []) as Array<{ found_item_id: string; storage_path: string }>;

  const signedUrls = await getSignedImageUrls([
    ...lostPaths.map((r) => r.storage_path),
    ...foundPaths.map((r) => r.storage_path),
  ]);

  const imageUrlByItem = new Map<string, string>();
  lostPaths.forEach((r, i) => {
    if (signedUrls[i]) imageUrlByItem.set(r.lost_item_id, signedUrls[i]);
  });
  foundPaths.forEach((r, i) => {
    if (signedUrls[lostPaths.length + i]) {
      imageUrlByItem.set(r.found_item_id, signedUrls[lostPaths.length + i]);
    }
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-3xl">Saved</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Reports you&apos;ve bookmarked to check again later.
          </p>
        </div>
        {savedItems.length > 0 && (
          <span className="rounded-full border border-electric-200 bg-electric-50 px-2.5 py-0.5 text-xs font-semibold text-electric-700">
            {savedItems.length} saved
          </span>
        )}
      </div>

      {!savedItems || savedItems.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/50 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
            <Bookmark size={20} />
          </div>
          <p className="mt-3 font-medium text-navy-900">No saved items yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Browse reports and bookmark items to save them for later.
          </p>
          <Link
            href="/discover"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-electric-50 px-4 py-2 text-sm font-medium text-electric-700 transition hover:bg-electric-100"
          >
            Browse reports
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {savedItems.map((saved: any) => {
            const isLost = !!saved.lost_item_id;
            // Postgrest-js v2 returns joined relations as arrays
            const item = Array.isArray(saved.lost_items) ? saved.lost_items[0] : (saved.lost_items ?? (Array.isArray(saved.found_items) ? saved.found_items[0] : saved.found_items));
            const itemId = saved.lost_item_id ?? saved.found_item_id;
            const href = isLost ? `/lost/${itemId}` : `/found/${itemId}`;
            const image = imageUrlByItem.get(itemId);
            const title = item?.title ?? "Unknown item";
            const category = item?.category
              ? CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ?? "Other"
              : "";
            const location = [item?.city, item?.province].filter(Boolean).join(", ") || "—";
            const status = item?.status ?? "active";

            return (
              <div
                key={saved.id}
                className="card card-hover group flex items-center gap-4 p-4 transition-shadow"
              >
                {/* Thumbnail */}
                <Link href={href} className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img loading="lazy" src={image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-electric-50 via-ice-50 to-lavender-50 text-slate-400">
                      <Bookmark size={18} />
                    </div>
                  )}
                  <span
                    className={`absolute left-1 top-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                      isLost ? "bg-red-100/90 text-red-700" : "bg-emerald-100/90 text-emerald-700"
                    }`}
                  >
                    {isLost ? "Lost" : "Found"}
                  </span>
                </Link>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <Link href={href} className="truncate text-sm font-medium text-navy-900 hover:text-electric-700">
                    {title}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {category && <span>{category}</span>}
                    {category && <span className="text-slate-300">·</span>}
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="shrink-0" />
                      {location}
                    </span>
                  </div>
                </div>

                {/* Status + Actions */}
                <div className="flex shrink-0 items-center gap-3">
                  <StatusPill status={status} />
                  <RemoveSavedButton savedId={saved.id} title={title} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
