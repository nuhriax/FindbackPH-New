"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookmarkX } from "lucide-react";
import { unsaveItemAction } from "@/lib/actions/items";
import { useToast } from "@/components/ui/toast";

export function RemoveSavedButton({ savedId, title }: { savedId: string; title: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  function handleRemove() {
    const formData = new FormData();
    formData.set("savedItemId", savedId);
    startTransition(async () => {
      const result = await unsaveItemAction(formData);
      if (result?.error) {
        toast("error", result.error);
      } else {
        toast("success", `Removed "${title}" from your saved items.`);
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isPending}
      aria-label="Remove from saved"
      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
      title="Remove from saved"
    >
      <BookmarkX size={18} />
    </button>
  );
}