"use client";

import { useState, useTransition } from "react";
import { Archive, CheckCircle2, RotateCcw } from "lucide-react";
import { setMyReportStatusAction } from "@/lib/actions/my-reports";
import { useToast } from "@/components/ui/toast";
import type { ItemStatus } from "@/types/database";

export function ReportOwnerActions({
  itemType,
  itemId,
  status,
}: {
  itemType: "lost_item" | "found_item";
  itemId: string;
  status: ItemStatus;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function run(next: "recovered" | "archived" | "active", successMsg: string) {
    setError(null);
    startTransition(async () => {
      const result = await setMyReportStatusAction(itemType, itemId, next);
      if (result?.error) {
        setError(result.error);
        toast("error", result.error);
      } else {
        toast("success", successMsg);
      }
    });
  }

  const actions: React.ReactNode[] = [];

  if (status === "active") {
    actions.push(
      <button
        key="returned"
        type="button"
        disabled={isPending}
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
      >
        <CheckCircle2 size={16} aria-hidden="true" />
        Mark as Returned
      </button>
    );
    actions.push(
      <button
        key="archive"
        type="button"
        disabled={isPending}
        onClick={() => run("archived", "Report archived")}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/75 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-white"
      >
        <Archive size={16} aria-hidden="true" />
        Archive
      </button>
    );
  } else if (status === "archived") {
    actions.push(
      <button
        key="restore"
        type="button"
        disabled={isPending}
        onClick={() => run("active", "Report restored")}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/75 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-white"
      >
        <RotateCcw size={16} aria-hidden="true" />
        Restore
      </button>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">{actions}</div>
      {error && <p className="field-error mt-2">{error}</p>}

      {confirming && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-navy-900/40 p-4 backdrop-blur-sm"
          onClick={() => setConfirming(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm item returned"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-card border border-slate-200/70 bg-white p-6 shadow-soft fade-in"
          >
            <h3 className="font-display text-lg font-semibold text-navy-900">
              Mark as returned?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Are you sure this item has been returned? This will remove it from
              active listings and notify people you contacted.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setConfirming(false);
                  run("recovered", "Marked as returned");
                }}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                {isPending ? "Updating…" : "Yes, it's returned"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}