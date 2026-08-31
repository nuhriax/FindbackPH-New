import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidPhotoHash } from "@/lib/phash";

/**
 * POST /api/item-images
 * Uploads one or more photos for an existing report (lost or found) to the
 * "item-images" Storage bucket and records them in the `item_images` table.
 *
 * A Route Handler is used here (rather than a Server Action) because files are
 * transmitted as multipart/form-data. Next.js Server Actions cannot serialize
 * `File` objects passed as arguments, so sending photos through a route handler
 * is the supported path.
 *
 * Expected body (multipart/form-data):
 *   itemType: "lost_item" | "found_item"
 *   itemId:   the report's id
 *   images:   one or more image File fields
 */
const VALID_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB per image
const MAX_COUNT = 4;

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to upload photos" },
      { status: 401 }
    );
  }

  let formData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Could not read the uploaded photos." },
      { status: 400 }
    );
  }

  const itemType = formData.get("itemType")?.toString();
  const itemId = formData.get("itemId")?.toString() ?? "";
  const files = formData
    .getAll("images")
    .filter((v): v is File => typeof v !== "string");

  if (itemType !== "lost_item" && itemType !== "found_item") {
    return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
  }
  if (!itemId) {
    return NextResponse.json({ error: "Missing report id" }, { status: 400 });
  }
  if (files.length === 0) {
    return NextResponse.json(
      { error: "Please add at least one photo before submitting." },
      { status: 400 }
    );
  }
  if (files.length > MAX_COUNT) {
    return NextResponse.json(
      { error: `You can upload up to ${MAX_COUNT} photos per report.` },
      { status: 400 }
    );
  }
  for (const file of files) {
    if (!VALID_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only image files (JPEG, PNG, WebP, GIF) are allowed" },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Each image must be smaller than 5 MB" },
        { status: 400 }
      );
    }
  }

  // Ownership: the signed-in user may only attach photos to their own report.
  const tableName = itemType === "lost_item" ? "lost_items" : "found_items";
  const { data: item, error: itemError } = await supabase
    .from(tableName)
    .select("reporter_id")
    .eq("id", itemId)
    .single();

  if (itemError || !item || item.reporter_id !== user.id) {
    return NextResponse.json(
      { error: "You can only add photos to your own reports." },
      { status: 403 }
    );
  }

  const prefix = itemType === "lost_item" ? "lost" : "found";

  // Optional perceptual hashes computed client-side (one per photo, same
  // order as `images`). Malformed or missing entries are simply skipped —
  // hashing must never block an upload.
  let hashes: (string | null)[] = [];
  try {
    const parsed = JSON.parse(formData.get("phashes")?.toString() ?? "[]");
    if (Array.isArray(parsed)) hashes = parsed;
  } catch {
    hashes = [];
  }

  const uploads: {
    lost_item_id: string | null;
    found_item_id: string | null;
    storage_path: string;
    position: number;
    phash?: string | null;
  }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext =
      (file.name.split(".").pop()?.toLowerCase() ?? "jpg").replace(
        /[^a-z0-9]/g,
        ""
      ) || "jpg";
    // Unique name so re-uploads / edits never collide with existing files.
    // The leading "<user-id>/" folder makes the Storage bucket RLS scope every
    // write to its owner (see item-images policies in supabase/schema.sql).
    const fileName = `${user.id}/${prefix}_${itemId}_${Date.now()}_${i}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("item-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Item image upload error:", uploadError);
      return NextResponse.json(
        { error: "We couldn't save your photos. Please try again." },
        { status: 500 }
      );
    }

    uploads.push({
      lost_item_id: itemType === "lost_item" ? itemId : null,
      found_item_id: itemType === "found_item" ? itemId : null,
      storage_path: fileName,
      position: i,
      ...(isValidPhotoHash(hashes[i]) ? { phash: hashes[i] } : {}),
    });
  }

  const { error: insertError } = await supabase.from("item_images").insert(uploads);
  if (insertError) {
    console.error("Item image record insert error:", insertError);
    return NextResponse.json(
      { error: "We couldn't save your photos. Please try again." },
      { status: 500 }
    );
  }

  revalidatePath(`/lost/${itemId}`);
  revalidatePath(`/found/${itemId}`);
  revalidatePath("/lost");
  revalidatePath("/found");
  revalidatePath("/");

  return NextResponse.json({ ok: true });
}