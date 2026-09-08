import * as Sentry from "@sentry/nextjs";

/**
 * Node.js server-side Sentry initialization (server actions, route handlers,
 * RSC rendering). No-op until NEXT_PUBLIC_SENTRY_DSN is set.
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
