import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowRight,
  Calendar,
  Edit3,
  Fingerprint,
  MapPin,
  ShieldCheck,
  Sparkles,
  Banknote,
} from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/validation";
import { ImageGallery } from "@/components/image-gallery";
import { MessageButton } from "@/components/message-button";
import { SaveButton } from "@/components/save-button";
import { ShareButton } from "@/components/share-button";
import { ReportFlagButton } from "@/components/report-flag-button";
import { ReportOwnerActions } from "@/components/reports/report-owner-actions";

export type DetailItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  distinguishingFeatures: string | null;
  city: string | null;
  province: string | null;
  approximateLocation: string | null;
  status: string;
  createdAt: string | null;
  dateLabel: string;
  reward: number | null;
};

export type DetailMatch = {
  id: string;
  kind: "lost" | "found";
  title: string;
  category: string;
  city: string | null;
  province: string | null;
  score: number | null;
};

function confidence(score: number | null): { label: string; tone: string } {
  if (score == null) return { label: "Possible match", tone: "border-amber-200 bg-amber-50 text-amber-700" };
  if (score >= 0.75) return { label: "Strong match", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  if (score >= 0.6) return { label: "Possible match", tone: "border-amber-200 bg-amber-50 text-amber-700" };
  return { label: "Low match", tone: "border-slate-200 bg-slate-100 text-slate-600" };
}

export function ReportDetail({
  kind,
  item,
  images,
  reporter,
  isOwner,
  savedItemId,
  matches,
}: {
  kind: "lost" | "found";
  item: DetailItem;
  images: { url: string }[];
  reporter: { username: string; successful_returns: number } | null;
  isOwner: boolean;
  savedItemId: string | null;
  matches: DetailMatch[];
}) {
  const itemType = kind === "lost" ? "lost_item" : "found_item";
  const statusActive = item.status === "active" || item.status === "matched";
  const statusPill =
    kind === "lost"
      ? statusActive
        ? "bg-red-50 text-red-700 ring-red-200"
        : "bg-slate-100 text-slate-600 ring-slate-200"
      : statusActive
        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
        : "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/search" className="text-sm font-medium text-slate-500 transition-colors hover:text-blue-700">
          ← Back to search
        </Link>
        <ShareButton title={item.title} />
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <ImageGallery images={images} alt={item.title} />

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusPill}`}>
              {kind === "lost" ? (statusActive ? "Still missing" : "Not active") : statusActive ? "Awaiting owner" : "Not active"}
            </span>
            <span className="chip">{CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS]}</span>
            <span className="chip capitalize">{kind}</span>
          </div>

          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-900">{item.title}</h1>

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <MapPin size={14} aria-hidden="true" />
              {(item.approximateLocation ?? [item.city, item.province].filter(Boolean).join(", ")) || "Location not set"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} aria-hidden="true" />
              {kind === "lost" ? "Lost" : "Found"} {item.dateLabel}
            </span>
            {item.reward ? (
              <span className="flex items-center gap-1 font-medium text-emerald-700">
                <Banknote size={14} aria-hidden="true" /> ₱{item.reward.toLocaleString()} reward
              </span>
            ) : null}
          </div>

          <div className="card mt-6 p-6">
            <h2 className="font-display text-base font-semibold text-navy-900">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{item.description}</p>
          </div>

          {item.distinguishingFeatures && (
            <div className="card mt-4 p-6">
              <h2 className="font-display text-base font-semibold text-navy-900">Distinguishing features</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{item.distinguishingFeatures}</p>
            </div>
          )}

          {/* Report meta */}
          <div className="card mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Fingerprint size={13} aria-hidden="true" />
              Report ID: <span className="font-mono">{item.id.slice(0, 8)}</span>
            </span>
            <span>Posted {item.createdAt ? format(new Date(item.createdAt), "MMM d, yyyy") : "recently"}</span>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="text-sm text-slate-600">{kind === "lost" ? "Reported by" : "Found by"}</p>
            <p className="font-medium text-navy-900">{reporter?.username ?? "FindBack user"}</p>
            <p className="mt-1 text-xs text-slate-600">
              {reporter?.successful_returns ?? 0} successful return{reporter?.successful_returns === 1 ? "" : "s"}
            </p>

            <div className="mt-4 space-y-2">
              {!isOwner && (
                <MessageButton itemType={itemType} itemId={item.id} label={kind === "lost" ? "Message Owner" : "Message Finder"} />
              )}
              <SaveButton
                lostItemId={kind === "lost" ? item.id : undefined}
                foundItemId={kind === "found" ? item.id : undefined}
                savedItemId={savedItemId}
                isOwner={isOwner}
              />
            </div>
          </div>

          {isOwner && item.status !== "recovered" && (
            <div className="card p-5">
              <h2 className="font-display text-base font-semibold text-navy-900">Manage this report</h2>
              <div className="mt-3 space-y-3">
                <Link
                  href={`/dashboard/reports/${item.id}/edit`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/75 px-4 py-2.5 text-sm font-medium text-navy-900 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/50"
                >
                  <Edit3 size={15} aria-hidden="true" />
                  Edit Report
                </Link>
                <ReportOwnerActions itemType={itemType} itemId={item.id} status={item.status as any} />
              </div>
            </div>
          )}

          <div className="card flex items-start gap-2 p-4 text-sm leading-relaxed text-slate-600">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-electric-500" aria-hidden="true" />
            Never meet alone or share sensitive personal information until you&apos;ve verified the other person.
          </div>

          <ReportFlagButton itemType={itemType} itemId={item.id} />
        </aside>
      </div>

      {/* Possible matches */}
      {matches.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600">
              <Sparkles size={17} aria-hidden="true" />
            </span>
            <h2 className="font-display text-xl font-semibold text-navy-900">Possible matches</h2>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            These are possible matches based on category, location, date, and description. Nothing is
            confirmed — review before contacting anyone.
          </p>

          <div className="mt-5 space-y-3">
            {matches.map((m) => {
              const conf = confidence(m.score);
              return (
                <Link
                  key={m.id}
                  href={`/search/${m.id}`}
                  className="card card-hover flex flex-wrap items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={
                          m.kind === "lost"
                            ? "rounded-full border border-sunrise-200 bg-sunrise-50 px-2 py-0.5 text-[11px] font-medium text-sunrise-700"
                            : "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                        }
                      >
                        {m.kind === "lost" ? "Lost" : "Found"}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${conf.tone}`}>
                        {conf.label}
                      </span>
                    </div>
                    <p className="mt-2 font-medium text-navy-900">{m.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {CATEGORY_LABELS[m.category as keyof typeof CATEGORY_LABELS] ?? m.category} ·{" "}
                      {[m.city, m.province].filter(Boolean).join(", ") || "Location not set"}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-blue-700">
                    Review <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
