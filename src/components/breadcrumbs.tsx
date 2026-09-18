import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { jsonLdStringify } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

/**
 * Visible breadcrumbs + matching BreadcrumbList JSON-LD for deep pages.
 * Helps mobile back-navigation and lets search engines show the page trail.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...items];

  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdStringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: all.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: c.label,
              ...(c.href ? { item: c.href } : {}),
            })),
          }),
        }}
      />
      <ol className="flex min-w-0 items-center gap-0.5 text-[13px] text-slate-500">
        {all.map((c, i) => {
          const isLast = i === all.length - 1;
          // On small screens only the parent + current page survive — the
          // middle trail collapses into an ellipsis to save the row.
          const isMiddle = i > 0 && i < all.length - 1;
          return (
            <li
              key={`${c.label}-${i}`}
              className={`flex min-w-0 items-center gap-0.5 ${isMiddle ? "hidden sm:flex" : ""} ${isLast ? "flex-1" : "shrink-0"}`}
            >
              {i > 0 && (
                <ChevronRight size={13} aria-hidden="true" className="shrink-0 text-slate-300" />
              )}
              {isMiddle && (
                <span aria-hidden="true" className="px-0.5 text-slate-300 sm:hidden">
                  …
                </span>
              )}
              {c.href && !isLast ? (
                <Link
                  href={c.href}
                  className="flex shrink-0 items-center gap-1.5 rounded-md px-1 py-1.5 font-medium transition-colors hover:bg-slate-100 hover:text-navy-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-400/50"
                >
                  {i === 0 && <Home size={13} aria-hidden="true" />}
                  <span className={i === 0 ? "sr-only sm:not-sr-only" : undefined}>{c.label}</span>
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  title={c.label}
                  className="min-w-0 flex-1 truncate px-1 py-0.5 font-semibold text-slate-800"
                >
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
