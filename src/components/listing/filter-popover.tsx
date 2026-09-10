"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Accessible popover button used for the Discover page's Filters control.
 * Renders a pill button; clicking toggles an anchored panel that closes on
 * outside click or Escape (unlike a bare <details>, which stays open).
 */
export function FilterPopover({
  label,
  badge,
  children,
}: {
  label: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const firstField = rootRef.current?.querySelector<HTMLElement>(
      '[role="dialog"] input, [role="dialog"] select, [role="dialog"] button',
    );
    firstField?.focus();
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors ${
          open
            ? "border-teal-700 bg-teal-700 text-white"
            : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"
        }`}
      >
        {label}
        {badge}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-navy-950/40 backdrop-blur-[2px] sm:hidden"
          />
          <div
            id={panelId}
            role="dialog"
            aria-label="Filters"
            className="fixed inset-x-3 bottom-3 z-50 max-h-[85dvh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:z-40 sm:mt-2 sm:max-h-none sm:w-72 sm:overflow-visible"
          >
            {/* Panel header — gives the popover a title and an explicit close control */}
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Filters</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-teal-700"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
            {children}
          </div>
        </>
      )}
    </div>
  );
}
