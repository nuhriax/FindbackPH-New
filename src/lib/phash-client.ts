"use client";

/**
 * Browser-side perceptual hashing for report photos.
 *
 * Runs entirely in the user's browser before upload: the photo is decoded by
 * the browser's native image decoder, downscaled to 32×32 grayscale, run
 * through a 2-D DCT (type-II), and the sign of the 64 lowest-frequency
 * coefficients (excluding DC) becomes the 64-bit fingerprint.
 *
 * The hash is computed from a 32×32 canvas — no image bytes ever leave the
 * device for hashing purposes, and hashing adds negligible time to the upload.
 */

const SIZE = 32; // DCT input size (standard for pHash)

function hex16(value: bigint): string {
  return value.toString(16).padStart(16, "0");
}

/**
 * Computes a 16-hex-char pHash for the given image File.
 * Returns null when the browser cannot decode the image (caller skips hashing
 * for that photo — hashing must never block an upload).
 */
export async function computePhotoHash(file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    if (bitmap.width < 8 || bitmap.height < 8) {
      bitmap.close();
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      bitmap.close();
      return null;
    }

    // Downscale with aspect-fill so objects fill the frame consistently.
    const scale = Math.max(SIZE / bitmap.width, SIZE / bitmap.height);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    ctx.drawImage(bitmap, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
    bitmap.close();

    const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

    // Grayscale (Rec. 601 luma), normalized 0–1.
    const gray = new Float64Array(SIZE * SIZE);
    for (let i = 0; i < SIZE * SIZE; i++) {
      gray[i] =
        (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) /
        255;
    }

    // 2-D DCT-II via separable 1-D transforms (32×32 is tiny; direct math is fine).
    const dct = new Float64Array(SIZE * SIZE);
    const cos = (n: number, u: number, x: number) =>
      Math.cos(((2 * x + 1) * u * Math.PI) / (2 * n));

    const tmp = new Float64Array(SIZE * SIZE);
    for (let y = 0; y < SIZE; y++) {
      for (let u = 0; u < SIZE; u++) {
        let sum = 0;
        for (let x = 0; x < SIZE; x++) sum += gray[y * SIZE + x] * cos(SIZE, u, x);
        tmp[y * SIZE + u] = sum * (u === 0 ? Math.SQRT1_2 : 1) * Math.sqrt(2 / SIZE);
      }
    }
    for (let x = 0; x < SIZE; x++) {
      for (let v = 0; v < SIZE; v++) {
        let sum = 0;
        for (let y = 0; y < SIZE; y++) sum += tmp[y * SIZE + x] * cos(SIZE, v, y);
        dct[v * SIZE + x] = sum * (v === 0 ? Math.SQRT1_2 : 1) * Math.sqrt(2 / SIZE);
      }
    }

    // Flatten the lowest 8×8 frequency block, drop DC (index 0), take the top
    // 64 coefficients, threshold against their median → 64 bits.
    const low: number[] = [];
    for (let v = 0; v < 8; v++) {
      for (let u = 0; u < 8; u++) {
        if (v === 0 && u === 0) continue;
        low.push(dct[v * SIZE + u]);
      }
    }
    const sorted = [...low].sort((a, b) => a - b);
    const median =
      sorted.length % 2 === 1
        ? sorted[(sorted.length - 1) / 2]
        : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;

    let hash = 0n;
    for (let i = 0; i < 64; i++) {
      if (low[i] > median) hash |= 1n << BigInt(63 - i);
    }
    return hex16(hash);
  } catch {
    return null;
  }
}
