"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.08]"
    >
      {copied ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
