import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Public "similar reports" lookup used by the report wizard's live duplicate
 * check. Fuzzy-matches the query against active lost AND found reports so the
 * user sees "was this found?" / "don't double-post" hints while typing.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Sanitize: strip Postgrest pattern operators so the query can't break the
  // filter syntax or widen the match unexpectedly.
  const q = (searchParams.get("q") ?? "")
    .replace(/[%(),*]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);

  if (q.length < 4) {
    return NextResponse.json({ items: [] });
  }

  const supabase = await createClient();
  const pattern = `%${q}%`;

  const [lost, found] = await Promise.all([
    supabase
      .from("lost_items")
      .select("id, title, city, province")
      .eq("status", "active")
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("found_items")
      .select("id, title, city, province")
      .eq("status", "active")
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const items = [
    ...(lost.data ?? []).map((r) => ({ ...r, kind: "lost" as const })),
    ...(found.data ?? []).map((r) => ({ ...r, kind: "found" as const })),
  ];

  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "no-store" } },
  );
}
