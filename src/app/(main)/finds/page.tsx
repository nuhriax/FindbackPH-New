import { redirect } from "next/navigation";

// The combined lost/found feed moved from /finds to /explore.
// This keeps existing /finds links (and query params) working.
export default async function FindsRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v) params.set(key, v);
  }
  const query = params.toString();
  redirect(query ? `/discover?${query}` : "/discover");
}