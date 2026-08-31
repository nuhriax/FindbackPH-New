import Link from "next/link";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import type { ItemCategory } from "@/types/database";
import { ACCENT, type Accent } from "./accents";

/**
 * Soft per-category accent used for the icon (and its hover glow) so each tile
 * stays slightly distinct while the overall page palette remains restrained.
 */
const CATEGORY_ACCENTS: Record<
  ItemCategory,
  { icon: string; glow: string }
> = {
    phones: { icon: "text-electric-600", glow: "bg-electric-500/15" },
  wallets: { icon: "text-amber-600", glow: "bg-amber-500/15" },
  ids: { icon: "text-navy-600", glow: "bg-navy-500/15" },
  bags: { icon: "text-blue-600", glow: "bg-blue-500/15" },
  keys: { icon: "text-electric-600", glow: "bg-electric-500/15" },
  jewelry: { icon: "text-amber-600", glow: "bg-amber-500/15" },
  electronics: { icon: "text-electric-600", glow: "bg-electric-500/15" },
  documents: { icon: "text-navy-600", glow: "bg-navy-500/15" },
  clothing: { icon: "text-electric-600", glow: "bg-electric-500/15" },
  pets: { icon: "text-sunrise-600", glow: "bg-sunrise-500/15" },
  school_items: { icon: "text-electric-600", glow: "bg-electric-500/15" },
  other: { icon: "text-slate-600", glow: "bg-slate-400/20" },
};

/**
 * Compact category tile grid (2 per row on mobile, up to 6 across on desktop)
 * shared by the Lost/Found listing pages. Each tile is clickable and links back
 * to the same listing filtered by that category.
 */
export function ListingCategories({
  accent,
  activeCategory,
  buildHref,
  counts,
}: {
  accent: Accent;
  activeCategory: string;
  buildHref: (category: string) => string;
  /** Optional live per-category counts. When omitted, tiles stay neutral. */
  counts?: Partial<Record<ItemCategory, number>>;
}) {
  const a = ACCENT[accent];

  return (
    <section aria-label="Browse by category" className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-navy-900">Browse by category</h2>
        {activeCategory && (
          <Link
            href={buildHref("")}
            className="text-xs text-slate-500 transition-colors hover:text-blue-700"
          >
            Reset category
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {CATEGORIES.map((itemCategory) => {
          const isActive = activeCategory === itemCategory;
          const categoryAccent = CATEGORY_ACCENTS[itemCategory];
          const count = counts?.[itemCategory];

          return (
            <Link
              key={itemCategory}
              href={buildHref(itemCategory)}
              aria-current={isActive ? "true" : undefined}
              className={[
                "group relative flex flex-col items-center justify-center gap-1 rounded-xl border p-3.5 pb-3 text-center transition-all duration-200 hover:-translate-y-0.5",
                isActive
                  ? `border-blue-200 ${a.bgSoft} shadow-soft`
                  : "border-slate-200/70 bg-white/60 hover:border-blue-200 hover:bg-white/90 hover:shadow-soft",
              ].join(" ")}
            >
              {/* Icon */}
              <span
                className={`relative flex h-10 w-10 items-center justify-center rounded-lg [&_svg]:h-[19px] [&_svg]:w-[19px] transition-transform duration-200 ${
                  isActive ? a.textStrong : categoryAccent.icon
                }`}
              >
                {!isActive && (
                  <span
                    aria-hidden="true"
                    className={`absolute -inset-1 rounded-full opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-50 ${categoryAccent.glow}`}
                  />
                )}
                <span className="relative">
                  {CATEGORY_ICONS[itemCategory]}
                </span>
              </span>

              <span
                className={`text-[11px] font-medium leading-tight ${
                  isActive ? "text-navy-900" : "text-slate-600"
                }`}
              >
                {CATEGORY_LABELS[itemCategory]}
              </span>

              <span
                className={`text-[10px] leading-none ${
                  isActive ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {count != null
                  ? `${count.toLocaleString()} ${
                      count === 1 ? "report" : "reports"
                    }`
                  : "Browse"}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
