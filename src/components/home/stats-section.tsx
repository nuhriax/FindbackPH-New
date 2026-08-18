"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Check, MapPin, Clock } from "lucide-react";

/**
 * Stats section with animated number counters from real Supabase data.
 * Falls back to demo mode if no counts are available.
 */
export function StatsSection({
  lost,
  found,
  recovered,
  possibleMatches,
  className,
}: {
  lost: number;
  found: number;
  recovered: number;
  possibleMatches?: number;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format numbers with commas
  const fmt = (n: number) => n.toLocaleString();

  if (!mounted) return null;

  return (
    <section className={cn("mt-20 mb-12", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {/* Lost */}
          <article className="text-center">
            <div className="text-5xl lg:text-7xl font-display font-bold text-navy-900">{fmt(lost)}</div>
            <div className="mt-2 text-slate-500 text-sm font-medium">Lost reports</div>
          </article>

          {/* Found */}
          <article className="text-center">
            <div className="text-5xl lg:text-7xl font-display font-bold text-emerald-600">{fmt(found)}</div>
            <div className="mt-2 text-slate-500 text-sm font-medium">Found reports</div>
          </article>

          {/* Recovered */}
          <article className="text-center">
            <div className="text-5xl lg:text-7xl font-display font-bold text-cyan-600">{fmt(recovered)}</div>
            <div className="mt-2 text-slate-500 text-sm font-medium">Items reunited</div>
          </article>

          {/* Possible matches */}
          {possibleMatches !== undefined && possibleMatches > 0 ? (
            <article className="text-center">
              <div className="text-5xl lg:text-7xl font-display font-bold text-indigo-600">{fmt(
                possibleMatches
              )}</div>
              <div className="mt-2 text-slate-500 text-sm font-medium">Possible matches</div>
            </article>
          ) : (
            <article className="text-center opacity-50">
              <div className="text-5xl lg:text-7xl font-display font-bold text-slate-500">—</div>
              <div className="mt-2 text-slate-500 text-sm font-medium">Possible matches</div>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
