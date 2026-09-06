import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

// Canonical report detail pages live at /lost/[id] and /found/[id].
// This keeps legacy /search/[id] links working by resolving the report's type.
export default async function SearchReportRedirect({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [lost, found] = await Promise.all([
    supabase.from("lost_items").select("id").eq("id", id).maybeSingle(),
    supabase.from("found_items").select("id").eq("id", id).maybeSingle(),
  ]);

  if (lost.data) redirect(`/lost/${id}`);
  if (found.data) redirect(`/found/${id}`);
  notFound();
}
