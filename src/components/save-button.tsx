"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveItemAction, unsaveItemAction } from "@/lib/actions/items";
import { useToast } from "@/components/ui/toast";
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
  const router = useRouter();
  const { toast } = useToast();

  // Owners can't save their own reports meaningfully, hide the button
  if (isOwner) return null;

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      if (isSaved && savedItemId) {
        const fd = new FormData();
        fd.set("savedItemId", savedItemId);
        const result = await unsaveItemAction(fd);
        if (result?.error) {
          setError(result.error);
          toast("error", result.error);
        } else {
          setIsSaved(false);
          toast("success", "Report removed from saved items");
        }
      } else {
        const fd = new FormData();
        if (lostItemId) fd.set("lostItemId", lostItemId);
        if (foundItemId) fd.set("foundItemId", foundItemId);
        const result = await saveItemAction(fd);
        if (result?.error) {
          if (result.error === "You must be signed in to save items") {
            router.push("/login");
            return;
          }
          setError(result.error);
          toast("error", result.error);
        } else {
          setIsSaved(true);
          toast("success", "Report saved");
        }
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={isSaved}
        title={isSaved ? "Saved — click to remove" : "Save this report"}
        aria-label={isSaved ? "Remove from saved reports" : "Save this report"}
        className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-5 py-2 text-[13px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-400 focus-visible:ring-offset-2 active:translate-y-px ${
          isSaved
            ? "border-electric-500/40 bg-electric-500/10 text-electric-700"
            : "border-slate-200/80 bg-transparent text-slate-500 hover:bg-slate-50"
        }`}
      >
        <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
        {isPending ? "Saving…" : isSaved ? "Saved" : "Save Item"}
      </button>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}