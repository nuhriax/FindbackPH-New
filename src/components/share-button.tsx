"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Facebook, MessageCircle, Share2, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";

/**
 * PH-friendly share control.
 * - Native Web Share where supported (mobile).
 * - Fallback popover: copy link, Facebook sharer, and WhatsApp (very popular
 *   in the Philippines).
 */
export function ShareButton({ title }: { title: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  /* Close on outside click or Escape; return focus to the trigger. */
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        rootRef.current?.querySelector("button")?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const url =
    typeof window !== "undefined" ? window.location.href : "";
  const shareText = `Help find "${title}" on FindBack PH — the community lost & found platform.`;

  function openButton(href: string) {
    window.open(href, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  async function handleNativeShare() {
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: "FindBack PH", text: shareText, url });
        return;
      }
      throw new Error("no-native-share");
    } catch (error) {
      // Deliberate dismissal of the native sheet is not an error — just close.
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      // Fall through: fall back to the popover actions.
      setOpen(true);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("success", "Report link copied.");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast("error", "Couldn't copy the link. Please try again.");
    }
  }

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    url
  )}&quote=${encodeURIComponent(shareText)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `${shareText} ${url}`
  )}`;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={handleNativeShare}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white/75 px-4 text-sm font-medium text-navy-900 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-400 focus-visible:ring-offset-2 active:translate-y-px"
      >
        <Share2 size={16} aria-hidden="true" />
        Share
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="menu"
            aria-label="Share options"
            className="absolute right-0 top-full z-40 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
          >
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-xs font-semibold text-navy-900">Share this report</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-400"
                aria-label="Close share menu"
              >
                <X size={15} />
              </button>
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={copyLink}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-navy-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-400"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </span>
              {copied ? "Link copied" : "Copy link"}
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => openButton(facebookUrl)}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-navy-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-400"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Facebook size={15} />
              </span>
              Facebook
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => openButton(whatsappUrl)}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-navy-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-400"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <MessageCircle size={15} />
              </span>
              WhatsApp
            </button>
          </div>
        </>
      )}
    </div>
  );
}