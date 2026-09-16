import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side rate limiter for sensitive server actions (login, registration,
 * password reset, contact, posting, uploads).
 *
 * F-012 REMEDIATION: storage is the shared Postgres RPC
 * `consume_rate_limit` (supabase/migrations/20260916_rate_limit_rpc.sql), so
 * the window is enforced across ALL serverless instances instead of
 * per-process. The RPC is SECURITY DEFINER over an unexposed table and fails
 * closed on malformed input.
 *
 * If the migration hasn't been applied yet (RPC missing, Postgres 42P01), the
 * limiter degrades to the legacy in-process Map — best-effort per instance —
 * and logs once so deployment can be corrected. Nothing else changes.
 */

const buckets = new Map<string, number[]>();
let warnedFallback = false;

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** Legacy in-process sliding window (fallback only). */
function consumeInMemory(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSeconds: number } {
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

  try {
    const supabase = await createClient();
    // `consume_rate_limit` lives in the SQL migration (not the generated DB
    // types), so the RPC name is cast — arguments are validated by the RPC.
    const { data, error } = await supabase.rpc("consume_rate_limit" as never, {
      p_bucket: bucket,
      p_ip: ip,
      p_limit: limit,
      p_window_ms: windowMs,
    } as never);

    if (error) {
      // 42P01 = relation does not exist — the RPC migration isn't applied yet.
      // Fall back to in-memory (per-instance) limiting rather than failing
      // every request.
      if ((error as { code?: string }).code === "42P01") {
        if (!warnedFallback) {
          warnedFallback = true;
          console.error(
            "[rate-limit] consume_rate_limit RPC missing — apply " +
              "supabase/migrations/20260916_rate_limit_rpc.sql. Falling back " +
              "to per-instance in-memory limiting."
          );
        }
        return consumeInMemory(`${bucket}:${ip}`, limit, windowMs);
      }
      console.error("[rate-limit] RPC error:", error.message);
      return { ok: true, retryAfterSeconds: 0 };
    }

    if (data === true) return { ok: true, retryAfterSeconds: 0 };

    // Limited: approximate the wait from the window size.
    return { ok: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  } catch (e) {
    // Supabase unreachable — never hard-block users on infra failure; degrade
    // to the in-memory window so a single instance still throttles floods.
    console.error("[rate-limit] store unavailable, using in-memory:", e);
    return consumeInMemory(`${bucket}:${ip}`, limit, windowMs);
  }
}

/** Generic message returned to the user when a rate limit is hit. */
export const RATE_LIMIT_MESSAGE =
  "Too many attempts. Please wait a moment and try again.";
