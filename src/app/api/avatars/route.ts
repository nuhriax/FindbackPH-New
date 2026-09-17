import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAvatarPublicUrl } from "@/lib/storage";
import { consumeRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";

/**
 * POST /api/avatars
 * Uploads (or replaces) the signed-in user's profile photo in the "avatars"
 * Storage bucket and returns its public URL.
 *
 * A Route Handler is used (not a Server Action) so the multipart `File` can be
 * sent natively — Server Actions cannot serialize `File` arguments.
 *
 * Accepted request (multipart/form-data):
 *   avatar: the image File
 */
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const AVATAR_MAX_SIZE = 4 * 1024 * 1024; // 4 MB

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to upload a photo" },
      { status: 401 }
    );
  }

  // Abuse prevention: cap avatar replacement bursts per IP (10 / 10 min).
  const rl = await consumeRateLimit("avatars", 10, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }

  let formData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Could not read the uploaded photo." },
      { status: 400 }
    );
  }

  const file =
    formData.getAll("avatar").filter((v): v is File => typeof v !== "string")[0] ??
    null;

  if (!file || file.size === 0) {
    return NextResponse.json(
      { error: "Choose a photo to upload" },
      { status: 400 }
    );
  }
  if (!AVATAR_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only image files (JPEG, PNG, WebP, GIF) are allowed" },
      { status: 400 }
    );
  }
  if (file.size > AVATAR_MAX_SIZE) {
    return NextResponse.json(
      { error: "Photo must be smaller than 4 MB" },
      { status: 400 }
    );
  }

  const ext =
    (file.name.split(".").pop()?.toLowerCase() ?? "jpg").replace(
      /[^a-z0-9]/g,
      ""
    ) || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
    ? ext
    : "jpg";
  // IMPORTANT: the file MUST live inside the "<user-id>/" folder — the avatars
  // storage policies scope every write to (storage.foldername(name))[1] =
  // auth.uid(). A flat "<user-id>.<ext>" path has no folder, so the policy
  // evaluates to NULL and uploads are rejected ("Could not upload your photo").
  const fileName = `${user.id}/avatar.${safeExt}`;

  // Delete any previously stored avatar first. Uploading over an existing
  // object is an UPDATE for Storage policies — setups that only grant INSERT
  // (the documented default) reject it with "resource already exists", which
  // surfaced as an error every time the photo was changed after the first
  // upload. Removing first keeps every upload a plain INSERT.
  const { data: existingFiles } = await supabase.storage
    .from("avatars")
    .list(user.id);
  await supabase.storage.from("avatars").remove([
    ...(existingFiles ?? []).map((f) => `${user.id}/${f.name}`),
    // Legacy flat paths from before the folder-scoped policy fix. Removal is
    // best-effort — flat paths can't match the folder policy's DELETE check,
    // so unauthorized ones are silently skipped by Storage.
    `${user.id}.jpg`,
    `${user.id}.jpeg`,
    `${user.id}.png`,
    `${user.id}.webp`,
    `${user.id}.gif`,
  ]);

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("Avatar upload error:", uploadError);
    return NextResponse.json(
      { error: "Could not upload your photo. Please try again." },
      { status: 500 }
    );
  }

  // Persist the new avatar URL to the profile IMMEDIATELY — the user should
  // not have to press "Save profile" for the photo change to take effect.
  // The URL carries a cache-buster (?v=) so every page (navbar, member pages,
  // messages, reporter cards) fetches the fresh image, not the CDN-cached one.
  const avatarUrl = `${getAvatarPublicUrl(fileName)}?v=${Date.now()}`;
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);
  if (profileError) {
    console.error("Avatar profile update error:", profileError);
    return NextResponse.json(
      { error: "Photo uploaded but could not be applied. Try saving your profile." },
      { status: 500 }
    );
  }

  // Revalidate the whole layout — the navbar renders the avatar on every page,
  // so a narrow revalidation would leave stale photos across the site.
  revalidatePath("/", "layout");

  // Cache-buster: the filename never changes, so browsers/CDN would otherwise
  // keep showing the previous photo for up to an hour (cacheControl: 3600).
  return NextResponse.json({ avatarUrl });
}