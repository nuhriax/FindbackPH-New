import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getImagePublicUrl, getSignedImageUrls } from "@/lib/storage";
import { CATEGORY_LABELS } from "@/lib/validation";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ItemRow = {
  id: string;
  reporter_id: string;
  title: string;
  description: string | null;
  distinguishing_features: string | null;
  category: string | null;
  status: string | null;
  city: string | null;
  province: string | null;
  approximate_location: string | null;
  current_holding_info: string | null;
  reward_amount: number | null;
  date_found: string | null;
  date_lost: string | null;
  created_at: string;
  profiles: {
    id?: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
};

/** Map DB status (lowercase) to the client's uppercase status values. */
function mapStatus(status: string | null): string {
  switch (status) {
    case "matched":
      return "MATCHED";
    case "recovered":
      return "RESOLVED";
    case "removed":
    case "archived":
      return "REMOVED";
    default:
      return "ACTIVE";
  }
}

async function loadItem(supabase: Awaited<ReturnType<typeof createClient>>, id: string, table: "lost_items" | "found_items") {
  const fk = `${table}_reporter_id_fkey`;

  return supabase
    .from(table)
    .select(
      `*, profiles!${fk}(id, username, first_name, last_name, avatar_url)`
    )
    .eq("id", id)
    .maybeSingle();
}

/**
 * GET /api/items/[id]
 * Returns a unified item detail payload for both lost and found items.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { error: "Item not found." },
      { status: 404 }
    );
  }

  const [lostResult, foundResult, authResult] = await Promise.all([
    loadItem(supabase, id, "lost_items"),
    loadItem(supabase, id, "found_items"),
    supabase.auth.getUser(),
  ]);

  if (lostResult.error) {
    console.error("[items] lost lookup:", lostResult.error.message);
  }
  if (foundResult.error) {
    console.error("[items] found lookup:", foundResult.error.message);
  }

  const isLost = Boolean(lostResult.data);
  const row = (lostResult.data ?? foundResult.data) as ItemRow | null;

  if (!row) {
    return NextResponse.json(
      { error: "Item not found." },
      { status: 404 }
    );
  }

  const imageCol = isLost ? "lost_item_id" : "found_item_id";
  const { data: images } = await supabase
    .from("item_images")
    .select("id, storage_path, position")
    .eq(imageCol, id)
    .order("position", { ascending: true });

  const profile = Array.isArray(row.profiles)
    ? row.profiles[0]
    : row.profiles;

  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const ownerName = fullName || "Community member";

  const storedPaths = (images ?? []).map((image) => image.storage_path);
  const signedUrls = await getSignedImageUrls(storedPaths);
  const urlByPath = new Map(storedPaths.map((p, i) => [p, signedUrls[i]]));

  const data = {
    id: row.id,
    ownerId: profile?.id ?? row.reporter_id,
    title: row.title,
    type: isLost ? "LOST" : "FOUND",
    status: mapStatus(row.status),
    description: row.description ?? "",
    city: row.city ?? "",
    province: row.province ?? "",
    barangay: null,
    approximateLocation:
      row.approximate_location ??
      row.current_holding_info ??
      "Not specified",
    dateOccurred: row.date_lost ?? row.date_found ?? row.created_at,
    brand: null,
    color: null,
    distinguishingFeatures: row.distinguishing_features,
    reward:
      row.reward_amount && Number(row.reward_amount) > 0
        ? `₱${Number(row.reward_amount).toLocaleString()}`
        : null,
    latitude: null,
    longitude: null,
    createdAt: row.created_at,
    category: {
      id: row.category ?? "other",
      name:
        CATEGORY_LABELS[
          row.category as keyof typeof CATEGORY_LABELS
        ] ?? row.category ?? "Uncategorized",
    },
    owner: {
      id: profile?.id ?? row.reporter_id,
      displayName: ownerName,
      username: profile?.username ?? "user",
      avatarUrl: profile?.avatar_url ?? null,
      campus: null,
    },
    images: (images ?? []).map((image) => ({
      id: image.id,
      url:
        urlByPath.get(image.storage_path) ??
        getImagePublicUrl(image.storage_path),
      alt: row.title,
    })),
    mine: authResult.data.user?.id === row.reporter_id,
  };

  return NextResponse.json({ data });
}

/**
 * DELETE /api/items/[id]
 * Soft-deletes (status = "removed") the caller's own report.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  let deleted = false;

  for (const table of ["lost_items", "found_items"] as const) {
    const { error, count } = await supabase
      .from(table)
      .update({ status: "removed" }, { count: "exact" })
      .eq("id", id)
      .eq("reporter_id", user.id);

    if (!error && (count ?? 0) > 0) {
      deleted = true;
    }
  }

  if (!deleted) {
    return NextResponse.json(
      { error: "Failed to delete. You can only delete your own reports." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
