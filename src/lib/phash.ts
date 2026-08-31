/**
 * Perceptual image hash (pHash) — pure, dependency-free helpers.
 *
 * A pHash is a 64-bit fingerprint of an image's low-frequency structure.
 * Visually similar photos land within a small Hamming distance of each other,
 * regardless of resolution, compression, or minor crops — which makes them
 * ideal for the "does this FOUND photo look like the LOST photo?" factor of
 * the matching engine.
 *
 * This module contains only pure bit/string math so it is safe to import from
 * both server code (matching engine, API routes) and client code. The browser
 * canvas decoding lives in `phash-client.ts`.
 */

/** A pHash serialized as 16 hex characters (64 bits). */
export type PhotoHash = string;

const HASH_BITS = 64;

/**
 * Hamming distance between two 64-bit pHashes expressed as hex strings.
 * Returns null when either hash is missing or malformed — callers treat that
 * as "factor not applicable" (never as a mismatch).
 */
export function hammingDistance(a: PhotoHash | null | undefined, b: PhotoHash | null | undefined): number | null {
  if (!a || !b || a.length !== 16 || b.length !== 16) return null;
  if (!/^[0-9a-f]{16}$/i.test(a) || !/^[0-9a-f]{16}$/i.test(b)) return null;

  let distance = 0;
  for (let i = 0; i < 16; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) {
      distance += x & 1;
      x >>= 1;
    }
  }
  return distance;
}

/**
 * Best (smallest) Hamming distance across any pair of the two photos sets —
 * reports can carry up to 4 photos each, so any photo on either side matching
 * counts as a photo signal.
 */
export function bestHashDistance(
  hashesA: PhotoHash[] | null | undefined,
  hashesB: PhotoHash[] | null | undefined
): number | null {
  if (!hashesA?.length || !hashesB?.length) return null;
  let best: number | null = null;
  for (const a of hashesA) {
    for (const b of hashesB) {
      const d = hammingDistance(a, b);
      if (d !== null && (best === null || d < best)) best = d;
    }
  }
  return best;
}

/** True when the value looks like a valid serialized pHash. */
export function isValidPhotoHash(value: unknown): value is PhotoHash {
  return typeof value === "string" && /^[0-9a-f]{16}$/i.test(value);
}

/**
 * Photo-similarity score (0 .. weight) from the best Hamming distance.
 * Calibrated for 64-bit DCT pHashes:
 *   ≤ 10 bits  → almost certainly the same photo/scene
 *   ≤ 18 bits  → plausibly the same object, different shot
 *   ≤ 26 bits  → weak visual similarity
 *   >  26 bits → visually different
 */
export function photoScoreFromDistance(
  distance: number | null,
  weight: number
): { earned: number; detail: string } | null {
  if (distance === null) return null;
  if (distance <= 10) {
    return { earned: weight, detail: "Photos look nearly identical" };
  }
  if (distance <= 18) {
    return { earned: Math.round(weight * 0.75), detail: "Photos look very similar" };
  }
  if (distance <= 26) {
    return { earned: Math.round(weight * 0.4), detail: "Photos have some visual similarity" };
  }
  return { earned: 0, detail: "Photos look different" };
}
