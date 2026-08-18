import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSavedItems, unsaveItemAction } from "@/lib/actions/items";
import { BookmarkX, Bookmark } from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function SavedItemsPage() {
  const supabase = createClient();
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
        <h1 className="font-display text-3xl font-bold text-navy-900">Saved Items</h1>
        <p className="mt-1 text-sm text-slate-700">Items you&apos;ve saved for later.</p>

        {!savedItems || savedItems.length === 0 ? (
          <div className="mt-8 card p-8 text-center">
            <Bookmark size={48} className="mx-auto mb-4 text-slate-700" />
            <p className="text-slate-700">You haven&apos;t saved any items yet.</p>
            <p className="mt-2 text-sm text-slate-700">
              Save items to keep track of reports as you browse.
            </p>
            <div className="mt-4">
              <Link href="/search" className="btn-primary">
                Search Reports
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {savedItems.map((saved) => {
              const lostItem = saved.lost_items?.[0];
              const foundItem = saved.found_items?.[0];
              const item = lostItem ?? foundItem ?? null;
              const isLost = !!lostItem;
              const href = isLost ? `/lost/${saved.lost_item_id}` : `/found/${saved.found_item_id}`;
              const statusColor = item?.status === "recovered" ? "text-emerald-700" : "text-amber-700";

              return (
                <div key={saved.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <Link href={href} className="group">
                        <h3 className="font-display text-lg font-semibold text-navy-900 group-hover:text-blue-600 transition-colors">
                          {item?.title ?? "Unknown item"}
                        </h3>
                      </Link>
                      <p className="mt-1 text-sm text-slate-700 line-clamp-2">
                        {item?.description ?? "No description"}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-700">
                        <span className={`capitalize ${statusColor}`}>{item?.status ?? "active"}</span>
                        <span>{item?.city}, {item?.province}</span>
                      </div>
                    </div>
                    <form
                      action={async (formData: FormData) => {
                        "use server";
                        await unsaveItemAction(formData);
                      }}
                    >
                      <input type="hidden" name="savedItemId" value={saved.id} />
                      <button
                        type="submit"
                        aria-label="Remove from saved"
                        className="rounded-lg p-1 text-slate-700 hover:bg-slate-100 hover:text-red-600"
                        title="Remove from saved"
                      >
                        <BookmarkX size={18} />
                      </button>
                    </form>
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

