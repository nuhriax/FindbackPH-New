import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { CATEGORY_LABELS } from "@/lib/validation";
import { MapPin, Calendar, ShieldCheck, Banknote } from "lucide-react";
import { RecoveredButton } from "@/components/recovered-button";

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="aspect-video w-full rounded-2xl bg-navy-900 flex items-center justify-center text-slate-600">
            No photo uploaded
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-300">
              {item.status === "active" ? "Still missing" : item.status}
            </span>
            <span className="rounded-full bg-navy-800 px-3 py-1 text-xs text-slate-300">
              {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS]}
            </span>
          </div>

          <h1 className="mt-3 font-display text-2xl font-semibold">{item.title}</h1>

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {item.approximate_location ?? `${item.city}, ${item.province}`}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} /> Lost {format(new Date(item.date_lost), "MMM d, yyyy")}
            </span>
            {item.reward_amount ? (
              <span className="flex items-center gap-1 text-emerald-300">
                <Banknote size={14} /> ₱{item.reward_amount.toLocaleString()} reward
              </span>
            ) : null}
          </div>

          <div className="card mt-6 p-5">
            <h2 className="font-medium">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{item.description}</p>
          </div>

          {item.distinguishing_features && (
            <div className="card mt-4 p-5">
              <h2 className="font-medium">Distinguishing features</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{item.distinguishing_features}</p>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="text-sm text-slate-400">Reported by</p>
            <p className="font-medium">{reporter?.username ?? "FindBack user"}</p>
            <p className="mt-1 text-xs text-slate-500">
              {reporter?.successful_returns ?? 0} successful return{reporter?.successful_returns === 1 ? "" : "s"}
            </p>

            {!isOwner && (
              <button className="btn-primary mt-4 w-full" disabled title="Messaging ships in the next phase">
                Contact safely
              </button>
            )}

            {isOwner && item.status === "active" && (
              <RecoveredButton itemId={item.id} />
            )}
          </div>

          <div className="card flex items-start gap-2 p-4 text-sm text-slate-400">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-electric-400" />
            Always meet in a public place and avoid sharing sensitive personal information until you&apos;ve verified the other person.
          </div>
        </aside>
      </div>
    </div>
  );
}
