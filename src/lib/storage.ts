/**
 * Builds the public URL for an image stored in the "item-images" bucket.
 * Uses the Supabase storage public URL. Only works for images uploaded with
 * public access (default for the item-images bucket).
 */
export function getImagePublicUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${supabaseUrl}/storage/v1/object/public/item-images/${storagePath}`;
}
