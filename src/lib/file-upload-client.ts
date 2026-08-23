/**
 * Client-side helpers for uploading files (report photos / profile photo).
 *
 * Server Actions cannot accept `File` objects as arguments (Next.js only
 * serializes JSON-like values), so uploads go to Route Handlers over `fetch`
 * with a multipart/form-data body — the supported path for files.
 */

/**
 * Uploads one or more report photos. Returns an error string on failure,
 * otherwise null on success.
 */
export async function uploadItemImagesClient(
  itemType: "lost_item" | "found_item",
  itemId: string,
  files: File[]
): Promise<string | null> {
  const formData = new FormData();
  formData.set("itemType", itemType);
  formData.set("itemId", itemId);
  for (const file of files) formData.append("images", file);

  try {
    const res = await fetch("/api/item-images", {
      method: "POST",
      body: formData,
    });
    const data: { error?: string } = await res.json().catch(() => ({}));
    if (!res.ok) {
      return data.error ?? "We couldn't save your photos. Please try again.";
    }
    return null;
  } catch {
    return "We couldn't save your photos. Please try again.";
  }
}

/** Uploads a profile photo and returns its public URL (or an error). */
export async function uploadAvatarClient(
  file: File
): Promise<{ avatarUrl?: string; error?: string }> {
  const formData = new FormData();
  formData.set("avatar", file);

  try {
    const res = await fetch("/api/avatars", { method: "POST", body: formData });
    const data: { avatarUrl?: string; error?: string } = await res
      .json()
      .catch(() => ({}));
    return data;
  } catch {
    return { error: "Could not upload your photo. Please try again." };
  }
}