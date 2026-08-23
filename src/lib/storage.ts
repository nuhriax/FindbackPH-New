import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Builds the public URL for an image stored in the "item-images" bucket.
 * Uses the Supabase storage public URL. Only works for images uploaded with
 * public access (default for the item-images bucket).
 */
export function getImagePublicUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${supabaseUrl}/storage/v1/object/public/item-images/${storagePath}`;
}

/**
 * Generates signed URLs (temporary, authenticated) for a list of item images.
 *
 * Unlike the public URL above, signed URLs work even when the item-images
 * bucket is private, which is a common reason stored report photos render as a
 * blank box. It prefers the service-role client (bypasses storage RLS), and
 * falls back to a signed URL via the anon session client, and finally to the
 * plain public URL.
 *
 * Only call this from server code — it touches Supabase cookies / env.
 */
export async function getSignedImageUrls(
  storagePaths: string[],
  expiresIn = 3600
): Promise<string[]> {
  const unique = Array.from(new Set(storagePaths.filter(Boolean)));
  if (unique.length === 0) return [];

  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createServiceRoleClient()
    : createClient();

  const { data, error } = await supabase.storage
    .from("item-images")
    .createSignedUrls(unique, expiresIn);

  if (error || !data) {
    // Fall back to public URLs (works when the bucket is public).
    return unique.map((p) => getImagePublicUrl(p));
  }

  return data.map((entry) => {
    if (entry.signedUrl) return entry.signedUrl;
    return entry.path ? getImagePublicUrl(entry.path) : "";
  });
}

/**
 * Builds the public URL for an avatar stored in the "avatars" bucket.
 * The bucket must be created as public in Supabase Storage.
 */
export function getAvatarPublicUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${supabaseUrl}/storage/v1/object/public/avatars/${storagePath}`;
}
