import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

/**
 * Sitemap for publicly crawlable routes plus every active lost/found report.
 * The base URL is configurable so it works in any preview environment.
 */
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://findbackph.me";

const now = new Date();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/discover`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/lost`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/found`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/report/lost`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/report/found`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/safety`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Append every active lost/found report so item detail pages get indexed.
  const supabase = await createClient();
  const itemRoutes: MetadataRoute.Sitemap = [];

  for (const [table, path] of [
    ["lost_items", "lost"],
    ["found_items", "found"],
  ] as const) {
    try {
      const { data } = await supabase
        .from(table)
        .select("id, updated_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5000);

      for (const row of data ?? []) {
        itemRoutes.push({
          url: `${baseUrl}/${path}/${row.id}`,
          lastModified: row.updated_at ? new Date(row.updated_at) : now,
          changeFrequency: "daily",
          priority: 0.6,
        });
      }
    } catch {
      // Sitemap should never fail the build if the DB is unreachable.
    }
  }

  return [...staticRoutes, ...itemRoutes];
}

