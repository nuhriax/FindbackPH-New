import * as Sentry from "@sentry/nextjs";

/**
 * Browser-side Sentry initialization.
 *
 * The whole init is a no-op until NEXT_PUBLIC_SENTRY_DSN is set (local dev /
 * Vercel preview without the var simply skip monitoring). Get a DSN at
 * sentry.io → Settings → Client Keys (free tier: 5k errors/month).
 *
 * Privacy (PH DPA + the app's own posture): sendDefaultPii stays false and no
 * user identifiers, messages, or report content are attached — only stack
 * traces, URLs, and browser metadata.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Alerts-only monitoring: a low sample rate keeps the free tier healthy.
    tracesSampleRate: 0.05,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
    environment: process.env.NODE_ENV,
  });
}
