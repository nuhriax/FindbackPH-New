"use client";

import { useState, useTransition } from "react";
import { Archive, CheckCircle2, RotateCcw } from "lucide-react";
import { setMyReportStatusAction } from "@/lib/actions/my-reports";
import type { ItemStatus } from "@/types/database";

export function ReportActions({
  itemType,
  itemId,
  status,
}: {
  itemType: "lost_item" | "found_item";
  itemId: string;
  status: ItemStatus;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(next: "recovered" | "archived" | "active") {
    setError(null);
    startTransition(async () => {
      const result = await setMyReportStatusAction(itemType, itemId, next);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "active" && (
        <>
          <button
            type="button"
            disabled={isPending}
            onClick={() => run("recovered")}
            className="btn-ghost !py-2 text-sm text-emerald-600"
          >
            <CheckCircle2 size={15} />
            {isPending ? "Updating…" : "Mark returned"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => run("archived")}
            className="btn-ghost !py-2 text-sm text-slate-500"
          >
            <Archive size={15} />
            Archive
          </button>
        </>
      )}
      {status === "archived" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run("active")}
          className="btn-ghost !py-2 text-sm"
        >
          <RotateCcw size={15} />
          Restore
        </button>
      )}
      {error && <span className="text-xs font-medium text-red-600">{error}</span>}
    </div>
  );
}