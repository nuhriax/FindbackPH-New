import type { MetadataRoute } from "next";

/**
 * Static sitemap for publicly crawlable routes.
 * The base URL is configurable so it works in any preview environment.
 */
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://findbackph.me";

const now = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
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

  return publicRoutes;
}
