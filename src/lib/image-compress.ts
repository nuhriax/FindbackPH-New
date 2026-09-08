"use client";

/**
 * Client-side image compression.
 *
 * Phone cameras produce 3–5 MB JPEGs; a 4-photo report can easily be 15 MB+
 * against a 1 GB free-tier Storage bucket. Downsizing/encoding in the browser
 * (max 1600px, JPEG ~0.82) shrinks typical photos to 100–400 KB — about 10×
 * more capacity for the same bucket, and much faster uploads on PH mobile
 * data. Animated GIFs are passed through untouched (canvas would flatten them).
 *
 * Compression is best-effort: if the canvas pipeline fails for any reason the
 * original file is returned, so upload flow never blocks.
 */

/** Longest edge of the stored image, in pixels. */
const MAX_DIMENSION = 1600;
/** JPEG encode quality (0–1). 0.82 is visually indistinguishable for photos. */
const JPEG_QUALITY = 0.82;
/** Files smaller than this skip the pipeline entirely — not worth the work. */
const MIN_SIZE_TO_COMPRESS = 300 * 1024; // 300 KB

function isCompressible(file: File): boolean {
  return (
    file.size >= MIN_SIZE_TO_COMPRESS &&
    ["image/jpeg", "image/png", "image/webp"].includes(file.type)
  );
}

async function compressImage(file: File): Promise<File> {
  if (!isCompressible(file) || typeof document === "undefined") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    // Already small enough and within budget — keep the original bytes.
    if (scale === 1 && file.size < 1024 * 1024) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // White fill so transparent PNGs don't turn black once encoded to JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY)
    );
    // Only keep the compressed version if it actually helped.
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file; // Never block an upload because compression failed.
  }
}

/** Compresses many files in parallel. */
export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressImage));
}

/** Compresses a single file (used for avatars). */
export const compressImageFile = compressImage;
