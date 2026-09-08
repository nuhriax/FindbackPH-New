import * as Sentry from "@sentry/nextjs";

/**
 * Edge-runtime Sentry initialization (middleware). No-op until
 * NEXT_PUBLIC_SENTRY_DSN is set.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.05,
    sendDefaultPii: false,
    environment: process.env.NODE_ENV,
  });
}
