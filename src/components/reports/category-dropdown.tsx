"use client";

// ---------------------------------------------------------------------------
// CategoryDropdown
// ---------------------------------------------------------------------------
// Theme-adaptive accessible category picker for the report wizard's Step 1.
// Light mode: white card surface. Dark mode: overridden by
// `.site-ink .report-panel-dark` rules in globals.css to match the ink panel.
//
// Native <select> <option>s cannot render icons, so this renders a custom
// listbox where every option shows its category glyph beside the label
// (Keys → key, Pets → paw print, …). The parent keeps a (visually hidden)
// real input named "category" in the form so FormData, DraftAutoSave and the
// SensitiveCategoryHint watcher keep working unchanged.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  FileText,
  Gem,
  GraduationCap,
  IdCard,
  Key,
  Laptop,
  Package,
  PawPrint,
  Shirt,
  ShoppingBag,
  Smartphone,
  Wallet,
} from "lucide-react";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";

export const CATEGORY_ICONS: Record<string, typeof Smartphone> = {
  phones: Smartphone,
  wallets: Wallet,
  ids: IdCard,
  bags: ShoppingBag,
  keys: Key,
  jewelry: Gem,
  electronics: Laptop,
  documents: FileText,
  clothing: Shirt,
  pets: PawPrint,
  school_items: GraduationCap,
  other: Package,
};

export function CategoryDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (category: string) => void;
}) {
  const [open, setOpen] = useState(false);
  // Index of the keyboard/hover-highlighted option while the listbox is open.
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

  const choose = (category: string) => {
    onChange(category);
    setOpen(false);
  };


  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setActive(Math.max(0, (CATEGORIES as readonly string[]).indexOf(value)));
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => Math.min(a + 1, CATEGORIES.length - 1));
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
        setActive(CATEGORIES.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(CATEGORIES[active]);
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

  const TriggerIcon = CATEGORY_ICONS[value] ?? Package;

  return (
    <div ref={rootRef} className="category-dropdown relative">
      <button
        type="button"
        role="combobox"
        aria-label="Category"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="category-listbox"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className="category-dropdown-trigger flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-base text-navy-900 shadow-sm transition-all hover:bg-slate-50 focus:border-teal-400/70 focus:outline-none focus:ring-4 focus:ring-teal-400/15"
      >
        <TriggerIcon size={18} className="report-field-icon shrink-0 text-teal-600/80" aria-hidden="true" />
        <span className={`flex-1 truncate ${value ? "" : "text-slate-400"}`}>
          {value
            ? CATEGORY_LABELS[value as keyof typeof CATEGORY_LABELS] ?? value
            : "Select a category"}
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
          id="category-listbox"
          role="listbox"
          aria-label="Category"
          className="category-listbox absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
        >
          {CATEGORIES.map((c, i) => {
            const Icon = CATEGORY_ICONS[c] ?? Package;
            const selected = c === value;
            const highlighted = i === active;
            return (
              <li
                key={c}
                role="option"
                aria-selected={selected}
                data-active={highlighted || undefined}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(c)}
                className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  selected
                    ? "bg-teal-50 font-semibold text-teal-800"
                    : highlighted
                      ? "bg-slate-50 text-navy-900"
                      : "text-slate-600"
                }`}
              >
                <Icon
                  size={16}
                  className={`shrink-0 ${selected ? "text-teal-600" : "text-slate-400"}`}
                  aria-hidden="true"
                />
                <span className="flex-1">{CATEGORY_LABELS[c]}</span>
                {selected && <Check size={15} className="shrink-0 text-teal-600" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

