"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { FilePlus2 } from "lucide-react";


/**
 * Desktop "Report Item" pill. Reveals the Lost/Found chooser on hover or
 * keyboard focus; both entries are real links so it also works without JS.
 */
export function ReportSplitCta() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) hide();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <Link
        href="/report/lost"
        aria-haspopup="menu"
        aria-expanded={open}
        className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-electric-500 to-electric-600 py-2 pl-1.5 pr-4 text-sm font-semibold text-white shadow-[0_10px_26px_-12px_rgba(15,123,122,0.7)] transition-all duration-200 hover:-translate-y-px hover:from-electric-400 hover:to-electric-500 active:translate-y-0"
      >
        <span
          aria-hidden="true"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-colors group-hover:bg-white/30"
        >
          <FilePlus2 size={14} strokeWidth={2.6} />
        </span>
        Report Item
      </Link>

      {/* pt bridge so the pointer can travel to the menu without a flicker */}
      <div className={clsx("absolute right-0 top-full pt-2", open ? "block" : "hidden")}>
        <div
          role="menu"
          aria-label="Report an item"
          className="w-52 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-[0_20px_50px_-20px_rgba(20,34,79,0.35)]"
        >
          <Link
            href="/report/lost"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-electric-50 hover:text-electric-700"
          >
            I lost something
          </Link>
          <Link
            href="/report/found"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-electric-50 hover:text-electric-700"
          >
            I found something
          </Link>
        </div>
      </div>
    </div>
  );
}
