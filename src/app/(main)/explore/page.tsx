import { redirect } from "next/navigation";

type SearchParamValue = string | string[] | undefined;

// The Discover feed moved from /explore to /discover.
// This keeps existing /explore links (and query params) working.
export default async function ExploreRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) => {
      if (Array.isArray(v)) return v.map((val) => [k, val] as [string, string]);
      return v ? ([[k, v]] as [string, string][]) : [];
    }),
  ).toString();
  redirect(query ? `/discover?${query}` : "/discover");
}
