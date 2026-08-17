"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reportFlagAction } from "@/lib/actions/items";
import { Flag, X } from "lucide-react";

const REASONS = [
  "Scam",
  "Fake report",
  "Harassment",
  "Suspicious behavior",
  "Inappropriate content",
  "Wrong information",
  "Other",
];

export function ReportFlagButton({
  itemType,
  itemId,
}: {
  itemType: "lost_item" | "found_item";
  itemId: string;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    formData.set("itemType", itemType);
    formData.set("itemId", itemId);
    setError(null);
    startTransition(async () => {
      const result = await reportFlagAction(formData);
      if (result?.error) {
        if (result.error === "You must be signed in to report") {
          router.push("/login");
          return;
        }
        setError(result.error);
      } else {
        setOpen(false);
        setDone(true);
      }
    });
  }

  if (done) {
    return (
      <p className="text-sm text-emerald-300">
        Thank you. Your report has been submitted for review.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-xs text-slate-500 transition-colors hover:text-red-400"
      >
        <Flag size={14} /> Report this item
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="card mt-3 space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Report this item</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 text-slate-400 hover:text-white"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
      <select name="reason" required className="input" defaultValue="">
        <option value="" disabled>
          Select a reason…
        </option>
        {REASONS.map((r) => (
          <option key={r} value={r.toLowerCase().replace(/ /g, "_")}>
            {r}
          </option>
        ))}
      </select>
      <textarea
        name="details"
        rows={3}
        placeholder="Optional details…"
        className="input"
        maxLength={1000}
      />
      {error && <p className="field-error">{error}</p>}
      <button type="submit" disabled={isPending} className="btn-secondary w-full !py-2 text-sm">
        {isPending ? "Submitting…" : "Submit report"}
      </button>
    </form>
  );
}