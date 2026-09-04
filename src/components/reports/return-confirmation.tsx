"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, HeartHandshake } from "lucide-react";
import { confirmReturnAction } from "@/lib/actions/return-confirm";
import { useToast } from "@/components/ui/toast";

export type ReturnConfirmState = {
  /** Signed-in conversation participant or the reporter. */
  canConfirm: boolean;
  viewerConfirmed: boolean;
  reporterConfirmed: boolean;
  total: number;
  status: string;
};

/**
 * Two-sided return confirmation (Trust & Safety 110). Shown on a report's
 * sidebar to the reporter and their conversation party. When both sides
 * confirm, the reporter's action finalizes the return.
 */
export function ReturnConfirmationCard({
  itemType,
  itemId,
  state,
}: {
  itemType: "lost_item" | "found_item";
  itemId: string;
  state: ReturnConfirmState;
}) {
  const { toast } = useToast();
  const [confirmed, setConfirmed] = useState(state.viewerConfirmed);
  const [total, setTotal] = useState(state.total);
  const [recovered, setRecovered] = useState(state.status === "recovered");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!state.canConfirm) return null;

  const bothConfirmed = confirmed && state.reporterConfirmed;

  function handleConfirm() {
    startTransition(async () => {
      const result = await confirmReturnAction(itemType, itemId, note);
      if (!result.ok) {
        toast("error", result.error);
        return;
      }
      setConfirmed(true);
      setTotal(result.total);
      if (result.recovered) setRecovered(true);
      toast(
        "success",
        "Thank you for confirming — this helps everyone trust FindBack.",
      );
    });
  }

  return (
    <section
      aria-label="Return confirmation"
      className="
        mt-6 overflow-hidden rounded-3xl border bg-white shadow-soft
        border-emerald-200/70
      "
    >
      <div className="px-5 py-5 sm:px-7">
        <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
          <HeartHandshake size={12} aria-hidden="true" />
          Return confirmation
        </p>

        {confirmed ? (
          <div className="flex items-start gap-2.5">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">
                Item returned successfully
              </p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                {total} {total === 1 ? "person has" : "people have"} confirmed
                this return
                {recovered ? " — this report is now marked as returned." : "."}
                {!state.reporterConfirmed && !recovered && (
                  " Waiting for the reporter to confirm."
                )}
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm leading-6 text-slate-700">
              Was this item returned successfully? Confirming helps us keep
              FindBack accurate and celebrates safe, honest handovers.
            </p>

            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              placeholder="Optional: a short thank-you note"
              className="input mt-3"
            />

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="btn-primary mt-3 w-full"
            >
              <CheckCircle2 size={16} aria-hidden="true" />
              {isPending ? "Confirming…" : "Item returned successfully"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
