import Link from "next/link";
import { MapPin, Sparkles } from "lucide-react";

export function DashboardMatches({ matches }: { matches: any[] }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-soft backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-electric-600" />
          <h2 className="font-display text-sm font-semibold text-navy-900">Possible Matches</h2>
        </div>
        <span className="rounded-full bg-electric-100 px-2 py-0.5 text-xs font-semibold text-electric-700">
          {matches.length}
        </span>
      </div>

      {matches.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white/50 p-5 text-center">
          <p className="text-sm text-slate-500">No possible matches yet.</p>
          <p className="mt-1 text-xs text-slate-400">We&apos;ll notify you when a matching found report appears.</p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {matches.slice(0, 4).map((match) => {
            const found = match.found_items;
            const location = [found?.city, found?.province].filter(Boolean).join(", ") || "Location not set";
            return (
              <div
                key={match.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/60 bg-white/80 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-navy-900">
                    {found?.title ?? "Matching found report"}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                    <MapPin size={11} className="shrink-0 text-slate-400" />
                    {location}
                  </p>
                </div>
                <Link
                  href={`/found/${match.found_item_id}`}
                  className="btn-secondary !py-1.5 text-xs"
                >
                  Review match
                </Link>
              </div>
            );
          })}
          {matches.length > 4 && (
            <p className="px-1 pt-1 text-xs text-slate-500">
              +{matches.length - 4} more matches
            </p>
          )}
        </div>
      )}
    </div>
  );
}