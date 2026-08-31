"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SearchCheck } from "lucide-react";

type SimilarReport = {
  id: string;
  kind: "lost" | "found";
  title: string;
  city: string | null;
  province: string | null;
};

/**
 * "Wait — was this yours?" duplicate check for the report wizard.
 *
 * As the user types the item name, live fuzzy-searches existing reports and
 * surfaces near-matches BEFORE they post a duplicate. A found-report hit on a
 * lost-report form is the best possible news, so the copy is framed that way.
 */
export function SimilarReportsHint({ kind }: { kind: "lost" | "found" }) {
  const [results, setResults] = useState<SimilarReport[] | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const seqRef = useRef(0);

  useEffect(() => {
    const input = document.getElementById("title") as HTMLInputElement | null;
    if (!input) return;

    const run = async (q: string) => {
      const trimmed = q.trim();
      if (trimmed.length < 4) {
        setResults(null);
        return;
      }
      const seq = ++seqRef.current;
      setLoading(true);
      try {
        const res = await fetch(`/api/similar?q=${encodeURIComponent(trimmed)}`);
        const data = (await res.json()) as { items?: SimilarReport[] };
        if (seq === seqRef.current) setResults(data.items ?? []);
      } catch {
        if (seq === seqRef.current) setResults(null);
      } finally {
        if (seq === seqRef.current) setLoading(false);
      }
    };

    const onChange = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => run(input.value), 600);
    };

    input.addEventListener("input", onChange);
    return () => {
      input.removeEventListener("input", onChange);
      clearTimeout(timerRef.current);
    };
  }, []);

  // Filter to the *opposite* kind first (a found match is the win), fall back
  // to same-kind duplicates so users don't double-post.
  const opposite = results?.filter((r) => r.kind !== kind) ?? [];
  const sameKind = results?.filter((r) => r.kind === kind) ?? [];
  const shown = (opposite.length > 0 ? opposite : sameKind).slice(0, 3);
  const showingOpposite = opposite.length > 0;

  if (!results || loading) {
    return loading ? (
      <p className="flex items-center gap-1.5 text-xs text-slate-400" role="status">
        <SearchCheck size={13} aria-hidden="true" className="animate-pulse" />
        Checking existing reports…
      </p>
    ) : null;
  }

  if (shown.length === 0) return null;

  return (
    <div
      role="note"
      className={`rounded-2xl border p-4 ${
        showingOpposite
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-amber-200 bg-amber-50/70"
      }`}
    >
      <p className="flex items-center gap-1.5 text-xs font-semibold text-navy-900">
        <SearchCheck
          size={14}
          aria-hidden="true"
          className={showingOpposite ? "text-emerald-600" : "text-amber-500"}
        />
        {showingOpposite
          ? "Good news — similar reports already exist!"
          : "Heads up — similar reports already exist"}
      </p>
      <ul className="mt-2 space-y-1.5">
        {shown.map((r) => (
          <li key={r.id}>
            <Link
              href={`/${r.kind}/${r.id}`}
              className="text-xs text-slate-600 underline-offset-2 hover:text-navy-900 hover:underline"
            >
              <span
                className={`mr-1.5 rounded px-1 py-0.5 text-[10px] font-semibold uppercase ${
                  r.kind === "lost"
                    ? "bg-sunrise-100 text-sunrise-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {r.kind}
              </span>
              {r.title}
              {r.city ? ` · ${r.city}` : ""}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        {showingOpposite
          ? kind === "lost"
            ? "One of these found reports might be your item — check before posting."
            : "Someone may have lost this — check before posting your found report."
          : "If it's the same item, view your existing report instead of posting a duplicate."}
      </p>
    </div>
  );
}
