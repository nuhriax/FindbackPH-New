"use client";

import { useState, useTransition } from "react";
import { markLostItemRecoveredAction } from "@/lib/actions/items";
import { CheckCircle2 } from "lucide-react";

export function RecoveredButton({ itemId }: { itemId: string }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return (
      <p className="mt-4 flex items-center gap-2 text-sm text-emerald-300">
        <CheckCircle2 size={16} /> Marked as recovered
      </p>
    );
  }

  return (
    <div className="mt-4">
      <button
        className="btn-secondary w-full"
        disabled={isPending}
        onClick={() => {
          if (!confirm("Mark this item as recovered? This will remove it from active listings.")) return;
          startTransition(async () => {
            const result = await markLostItemRecoveredAction(itemId);
            if (result?.error) setError(result.error);
            else setDone(true);
          });
        }}
      >
        {isPending ? "Updating…" : "Mark as recovered"}
      </button>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
