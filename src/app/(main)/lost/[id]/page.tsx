import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { CATEGORY_LABELS } from "@/lib/validation";
import { MapPin, Calendar, ShieldCheck, Banknote, CheckCircle2 } from "lucide-react";
import { RecoveredButton } from "@/components/recovered-button";
import { MessageButton } from "@/components/message-button";
import { SaveButton } from "@/components/save-button";
import { ShareButton } from "@/components/share-button";
import { ReportFlagButton } from "@/components/report-flag-button";
import { ImageGallery } from "@/components/image-gallery";
import { getImagePublicUrl } from "@/lib/storage";
import { JourneyTracker } from "@/components/ui/journey-tracker";

export const metadata = {
  title: "Lost Item Details — FindBack PH",
  description:
    "View the details, location, and status of a lost item report, and reach out safely to help reunite it with its owner.",
};

export default async function LostItemDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: item } = await supabase
    .from("lost_items")
    .select("*, profiles!lost_items_reporter_id_fkey(username, successful_returns)")
    .eq("id", params.id)
    .single();

  if (!item) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user?.id === item.reporter_id;
  const reporter = (item as any).profiles as { username: string; successful_returns: number } | null;

  // Fetch images for this item
  const { data: images } = await supabase
    .from("item_images")
    .select("storage_path, position")
    .eq("lost_item_id", params.id)
    .order("position", { ascending: true });

  const imageUrls =
    images?.map((img) => ({ url: getImagePublicUrl(img.storage_path) })) ?? [];

  // Possible matches — active found reports in the same category
  const { data: possibleMatches } = await supabase
    .from("found_items")
    .select("id, title, city, province, created_at")
    .eq("category", item.category)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(3);

  // Check if the current user has saved this item
  let savedItemId: string | null = null;
  if (user) {
    const { data: saved } = await supabase
      .from("saved_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("lost_item_id", params.id)
      .maybeSingle();
    savedItemId = saved?.id ?? null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: item.title,
            description: item.description ?? "",
            locationCreated: item.city
              ? `${item.city}${item.province ? `, ${item.province}` : ""}`
              : undefined,
            dateCreated: item.date_lost,
          }),
        }}
      />

      <div className="mb-6">
        <ShareButton title={item.title} />
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <ImageGallery images={imageUrls} alt={item.title} />

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
              {item.status === "active" ? "Still missing" : item.status}
            </span>
            <span className="chip">
              {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS]}
            </span>
          </div>

          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-900">{item.title}</h1>

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {item.approximate_location ?? `${item.city}, ${item.province}`}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} /> Lost {format(new Date(item.date_lost), "MMM d, yyyy")}
            </span>
            {item.reward_amount ? (
              <span className="flex items-center gap-1 font-medium text-emerald-700">
                <Banknote size={14} /> ₱{item.reward_amount.toLocaleString()} reward
              </span>
            ) : null}
          </div>

          <JourneyTracker kind="lost" returned={item.status !== "active"} />

          <div className="card mt-6 p-6">
            <h2 className="font-display text-base font-semibold text-navy-900">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{item.description}</p>
          </div>

          {item.distinguishing_features && (
            <div className="card mt-4 p-6">
              <h2 className="font-display text-base font-semibold text-navy-900">Distinguishing features</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{item.distinguishing_features}</p>
            </div>
          )}

          {possibleMatches && possibleMatches.length > 0 && (
            <div className="card mt-4 p-6">
              <h2 className="font-display text-base font-semibold text-navy-900">
                Possible matches in the community
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Active found items in the same category that may be related.
              </p>

              <ul className="mt-3 divide-y divide-slate-100">
                {possibleMatches.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/found/${m.id}`}
                      className="group flex items-center justify-between gap-3 py-2.5 text-sm"
                    >
                      <span className="truncate font-medium text-navy-900 transition-colors group-hover:text-electric-600">
                        {m.title}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">
                        {m.city}
                        {m.province ? `, ${m.province}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="text-sm text-slate-600">Reported by</p>
            <p className="font-medium text-navy-900">{reporter?.username ?? "FindBack user"}</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 size={12} aria-hidden="true" /> Community member
            </span>
            <p className="mt-1 text-xs text-slate-600">
              {reporter?.successful_returns ?? 0} successful return{reporter?.successful_returns === 1 ? "" : "s"}
            </p>

            <div className="mt-4 space-y-2">
              {!isOwner && (
                <MessageButton itemType="lost_item" itemId={item.id} label="Message Owner" />
              )}
              <SaveButton
                lostItemId={item.id}
                savedItemId={savedItemId}
                isOwner={isOwner}
              />
            </div>

            {isOwner && item.status === "active" && (
              <RecoveredButton itemId={item.id} />
            )}
          </div>

          <div className="card flex items-start gap-2 p-4 text-sm leading-relaxed text-slate-600">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-electric-500" />
            Always meet in a public place and avoid sharing sensitive personal information until you&apos;ve verified the other person.
          </div>

          <ReportFlagButton itemType="lost_item" itemId={item.id} />
        </aside>
      </div>
    </div>
  );
}

