import { headers } from "next/headers";

/**
 * Lightweight, dependency-free server-side rate limiter for sensitive server
 * actions (login, registration, password reset, contact, posting).
 *
 * Storage is in-process (a module-level Map) keyed by the client IP pulled from
 * the request headers. On a single serverless instance this reliably blunts
 * brute-force / spam floods. Across a fleet it is best-effort per instance —
 * acceptable here because it adds no dependency and no external store, and the
 * sensitive endpoints are also protected by Supabase and per-user cooldowns.
 */

const buckets = new Map<string, number[]>();

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/**
 * Attempts to consume a "token" from a sliding window for `bucket`.
 * Returns `ok: false` (with seconds until allowed) once the limit is reached.
 */
export async function consumeRateLimit(
  bucket: string,
  limit: number,
  windowMs: number
): Promise<{ ok: boolean; retryAfterSeconds: number }> {
  const ip = await clientIp();
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((hits[hits.length - limit] + windowMs - now) / 1000)
    );
    return { ok: false, retryAfterSeconds };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfterSeconds: 0 };
}

/** Generic message returned to the user when a rate limit is hit. */
export const RATE_LIMIT_MESSAGE =
  "Too many attempts. Please wait a moment and try again.";
