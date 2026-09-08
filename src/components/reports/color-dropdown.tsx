"use client";

// ---------------------------------------------------------------------------
// ColorDropdown
// ---------------------------------------------------------------------------
// Theme-adaptive accessible primary-color picker for the report wizard's
// Step 1 and the edit-report form. Mirrors CategoryDropdown's structure and
// reuses its `category-dropdown-trigger` / `category-listbox` classes so the
// `.site-ink .report-panel-dark` overrides in globals.css apply unchanged.
//
// Every option shows a color dot beside its label; the first option clears
// the selection (color is optional). The parent keeps the real hidden input
// named "color" in the form so FormData and DraftAutoSave keep working.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { COLORS, COLOR_LABELS } from "@/lib/validation";
import type { ColorValue } from "@/lib/validation";

export function ColorDropdown({
  value,
  onChange,
}: {
  value: ColorValue | "";
  onChange: (color: ColorValue | "") => void;
}) {
  const [open, setOpen] = useState(false);
  // Index of the keyboard/hover-highlighted option while the listbox is open.
  // Index 0 is the "no color" option; colors start at 1.
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Close when clicking anywhere outside the picker.
  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  // Keep the highlighted option scrolled into view while navigating.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (color: ColorValue | "") => {
    onChange(color);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setActive(value ? (COLORS as readonly { value: string }[]).findIndex((c) => c.value === value) + 1 : 0);
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => Math.min(a + 1, COLORS.length));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(COLORS.length);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(active === 0 ? "" : COLORS[active - 1].value);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const selectedColor = COLORS.find((c) => c.value === value);
  const triggerLabel = selectedColor?.label ?? "No color selected";

  return (
    <div ref={rootRef} className="category-dropdown relative">
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="color-listbox"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className="category-dropdown-trigger flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-base text-navy-900 shadow-sm transition-all hover:bg-slate-50 focus:border-teal-400/70 focus:outline-none focus:ring-4 focus:ring-teal-400/15"
      >
        {selectedColor ? (
          <span
            className="inline-block h-4 w-4 shrink-0 rounded-full border border-slate-300 shadow-sm"
            style={{ backgroundColor: selectedColor.hex }}
            aria-hidden="true"
          />
        ) : (
          <span
            className="inline-block h-4 w-4 shrink-0 rounded-full border-2 border-dashed border-slate-300"
            aria-hidden="true"
          />
        )}
        <span className={`flex-1 truncate ${selectedColor ? "" : "text-slate-400"}`}>
          {triggerLabel}
        </span>
        <ChevronDown
          size={18}
          className={`report-faint shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id="color-listbox"
          role="listbox"
          aria-label="Primary color"
          className="category-listbox absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
        >
          {/* Clear option — color is optional. */}
          <li
            role="option"
            aria-selected={value === ""}
            data-active={active === 0 || undefined}
            onMouseEnter={() => setActive(0)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose("")}
            className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
              value === ""
                ? "bg-teal-50 font-semibold text-teal-800"
                : active === 0
                  ? "bg-slate-50 text-navy-900"
                  : "text-slate-600"
            }`}
          >
            <span
              className="inline-block h-4 w-4 shrink-0 rounded-full border-2 border-dashed border-slate-300"
              aria-hidden="true"
            />
            <span className="flex-1">No color selected</span>
            {value === "" && <Check size={15} className="shrink-0 text-teal-600" aria-hidden="true" />}
          </li>
          {COLORS.map((c, i) => {
            const selected = c.value === value;
            const highlighted = i + 1 === active;
            return (
              <li
                key={c.value}
                role="option"
                aria-selected={selected}
                data-active={highlighted || undefined}
                onMouseEnter={() => setActive(i + 1)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(c.value)}
                className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  selected
                    ? "bg-teal-50 font-semibold text-teal-800"
                    : highlighted
                      ? "bg-slate-50 text-navy-900"
                      : "text-slate-600"
                }`}
              >
                <span
                  className="inline-block h-4 w-4 shrink-0 rounded-full border border-slate-300 shadow-sm"
                  style={{ backgroundColor: c.hex }}
                  aria-hidden="true"
                />
                <span className="flex-1">{COLOR_LABELS[c.value]}</span>
                {selected && <Check size={15} className="shrink-0 text-teal-600" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
