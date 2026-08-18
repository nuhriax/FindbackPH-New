"use client";

import { useState, useTransition } from "react";
import { saveItemAction, unsaveItemAction } from "@/lib/actions/items";
import { Bookmark } from "lucide-react";

export function SaveButton({
  lostItemId,
  foundItemId,
  savedItemId,
  isOwner,
}: {
  lostItemId?: string;
  foundItemId?: string;
  savedItemId?: string | null;
  isOwner?: boolean;
}) {
  const [isSaved, setIsSaved] = useState(Boolean(savedItemId));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Owners can't save their own reports meaningfully, hide the button
  if (isOwner) return null;

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      if (isSaved && savedItemId) {
        const fd = new FormData();
        fd.set("savedItemId", savedItemId);
        const result = await unsaveItemAction(fd);
        if (result?.error) setError(result.error);
        else setIsSaved(false);
      } else {
        const fd = new FormData();
        if (lostItemId) fd.set("lostItemId", lostItemId);
        if (foundItemId) fd.set("foundItemId", foundItemId);
        const result = await saveItemAction(fd);
        if (result?.error) setError(result.error);
        else setIsSaved(true);
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
          isSaved
            ? "border-electric-400/60 bg-electric-50 text-electric-700"
            : "border-slate-200 bg-white/75 text-navy-900 shadow-sm hover:border-blue-300 hover:bg-blue-50/50"
        }`}
      >
        <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
        {isSaved ? "Saved" : "Save report"}
      </button>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}