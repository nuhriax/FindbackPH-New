"use client";

import { useState, useTransition } from "react";
import { HeartHandshake, Star, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { recordReuniteFeedbackAction } from "@/lib/actions/reunite";

export type ReuniteItem = { id: string; title: string; kind: "lost" | "found" };

/**
 * Phase 16 — 3-tap "Did it reunite?" user signal.
 * Shown next to an owner's recovered reports. Records lightweight, honest
 * outcomes (real returns vs. false positives) so the team can measure value.
 * Tap 1: Yes/Not yet. Tap 2: pick a star. Tap 3: it submits automatically.
 */
export function ReuniteFeedback({ items }: { items: ReuniteItem[] }) {
  const { toast } = useToast();
  const [answered, setAnswered] = useState<Record<string, "yes" | "no">>({});
  const [done, setDone] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  if (items.length === 0) return null;

  function submit(
    item: ReuniteItem,
    rating?: number,
    reunitedValue?: "yes" | "no"
  ) {
    const formData = new FormData();
    const answer = reunitedValue ?? answered[item.id];
    formData.set("itemType", item.kind === "lost" ? "lost_item" : "found_item");
    formData.set("itemId", item.id);
    formData.set("reunited", answer === "no" ? "false" : "true");
    if (rating) formData.set("rating", String(rating));

    startTransition(async () => {
      const res = await recordReuniteFeedbackAction(formData);
      if (res.ok) {
        setDone((prev) => new Set(prev).add(item.id));
        toast(
          "success",
          "Thanks! This helps other members reunite safely."
        );
      } else {
        toast("error", res.error);
        setAnswered((prev) => {
          const next = { ...prev };
          delete next[item.id];
          return next;
        });
      }
    });
  }

  return (
    <section className="card p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600">
          <HeartHandshake size={18} />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-navy-900">
            Share the win
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Did any of these items make it back to their owner?
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => {
          const state = answered[item.id];
          if (done.has(item.id)) {
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/50 px-4 py-3"
              >
                <p className="text-sm font-medium text-emerald-700">
                  <span className="font-semibold">{item.title}</span> — thanks
                  for the update!
                </p>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200/80 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-sm font-semibold text-navy-900">
                  {item.title}
                </p>
                <span className="shrink-0 rounded-full bg-ice-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {item.kind}
                </span>
              </div>

              {!state && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setAnswered((prev) => ({ ...prev, [item.id]: "yes" }))
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                  >
                    <HeartHandshake size={13} /> Yes, it returned home
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAnswered((prev) => ({ ...prev, [item.id]: "no" }));
                      submit(item, undefined, "no");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Not yet
                  </button>
                </div>
              )}

              {state === "yes" && (
                <>
                  <p className="mt-3 text-xs text-slate-500">
                    How smoothly did the return go?
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        disabled={pending}
                        onClick={() => submit(item, n)}
                        aria-label={`Rate ${n} of 5`}
                        className="text-amber-400 transition hover:scale-110 disabled:opacity-50"
                      >
                        <Star size={22} fill="currentColor" />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {state === "no" && (
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <X size={13} /> Good to know — we won&apos;t count it as
                  returned.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}