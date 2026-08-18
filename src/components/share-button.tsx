"use client";

import { useToast } from "@/components/ui/toast";
import { Share2 } from "lucide-react";

export function ShareButton({ title }: { title: string }) {
  const { toast } = useToast();

  async function handleShare() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "FindBack PH",
          text: `Help find this ${title} on FindBack PH.`,
          url,
        });
        return;
      }
    } catch {
      // user cancelled — fall through to copy
    }

    // Fallback: copy link
    try {
      await navigator.clipboard.writeText(url);
      toast("success", "Report link copied.");
    } catch {
      toast("error", "Couldn't copy the link. Please try again.");
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/75 px-4 py-2 text-sm font-medium text-navy-900 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/50"
    >
      <Share2 size={16} aria-hidden="true" />
      Share
    </button>
  );
}
