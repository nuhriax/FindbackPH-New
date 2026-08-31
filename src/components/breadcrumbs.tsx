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
    <nav aria-label="Breadcrumb" className="mb-4">
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
      <ol className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
        {all.map((c, i) => {
          const isLast = i === all.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight size={12} aria-hidden="true" className="text-slate-300" />
              )}
              {c.href && !isLast ? (
                <Link
                  href={c.href}
                  className="flex items-center gap-1 rounded px-0.5 transition-colors hover:text-navy-800"
                >
                  {i === 0 && <Home size={12} aria-hidden="true" />}
                  {c.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className="font-medium text-navy-800">
                  {i === 0 && <Home size={12} aria-hidden="true" className="mr-1 inline" />}
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
