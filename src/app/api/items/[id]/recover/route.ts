import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/items/[id]/recover
 * Marks the caller's own lost/found report as recovered (resolved).
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  for (const table of ["lost_items", "found_items"] as const) {
    const { error, count } = await supabase
      .from(table)
      .update({ status: "recovered" }, { count: "exact" })
      .eq("id", id)
      .eq("reporter_id", user.id)
      .in("status", ["active", "matched"]);

    if (!error && (count ?? 0) > 0) {
      revalidatePath("/dashboard");
      revalidatePath(`/lost/${id}`);
      revalidatePath(`/found/${id}`);
      return NextResponse.json({ ok: true });
    }
  }

  return NextResponse.json(
    { error: "Failed to mark as recovered. You can only update your own reports." },
    { status: 400 }
  );
}
