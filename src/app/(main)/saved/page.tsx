import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSavedItems } from "@/lib/actions/items";
import { Bookmark, MapPin } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/validation";
import { RemoveSavedButton } from "@/components/saved/remove-saved-button";
import { BackButton } from "@/components/back-button";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function SavedItemsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const savedItems = await getUserSavedItems();

  return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <BackButton fallbackHref="/dashboard" />
        <span className="section-eyebrow mt-3 block">Your saved reports</span>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-tight text-navy-900">Saved Items</h1>
          {savedItems.length > 0 && (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              {savedItems.length} saved
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-slate-500">Items you&apos;ve bookmarked for later.</p>

        {!savedItems || savedItems.length === 0 ? (
          <div className="mt-8 rounded-card border border-slate-200/70 bg-white/70 p-12 text-center shadow-soft backdrop-blur-md">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-600">
              <Bookmark size={24} />
            </div>
            <h2 className="mt-5 font-display text-lg font-semibold text-navy-900">No saved items yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
              Save items to keep track of reports as you browse. They&apos;ll appear here.
            </p>
            <div className="mt-6">
              <Link href="/search" className="btn-primary">
                Search Reports
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {savedItems.map((saved) => {
              // Many-to-one embeds resolve to a single object (or null),
              // matching PostgREST's cardinality rules.
              const lostItem = saved.lost_items ?? null;
              const foundItem = saved.found_items ?? null;
              const item = lostItem ?? foundItem ?? null;
              const isLost = !!lostItem;
              const href = isLost ? `/lost/${saved.lost_item_id}` : `/found/${saved.found_item_id}`;
              const statusColor = item?.status === "recovered" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700";

              return (
                <div key={saved.id} className="card card-hover group flex flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={href} className="flex-1">
                      <h3 className="font-display text-lg font-semibold text-navy-900 transition-colors group-hover:text-blue-600">
                        {item?.title ?? "Unknown item"}
                      </h3>
                    </Link>
                    <RemoveSavedButton savedId={saved.id} title={item?.title ?? "Unknown item"} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
                    {item?.description ?? "No description"}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <MapPin size={13} className="text-blue-500" />
                    <span>{item?.city}, {item?.province}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs capitalize ${statusColor}`}>
                        {item?.status ?? "active"}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">
                        {CATEGORY_LABELS[(item?.category as keyof typeof CATEGORY_LABELS)] ?? "Other"}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      {isLost ? "Lost" : "Found"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

