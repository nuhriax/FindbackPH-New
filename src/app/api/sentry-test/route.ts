import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/sentry-test?token=<SENTRY_TEST_TOKEN>
 *
 * Deliberately throws a caught-and-reported error so you can verify Sentry is
 * receiving events end-to-end (browser + server init, DSN, project routing).
 *
 * Guarded: it only ever fires when the SENTRY_TEST_TOKEN env var is set AND
 * the request supplies the exact matching token. Without the env var (the
 * production default) the endpoint is inert and returns 404 — it can never be
 * abused to spam your Sentry quota or crash real requests.
 */
export async function GET(req: NextRequest) {
  const token = process.env.SENTRY_TEST_TOKEN;
  const provided = req.nextUrl.searchParams.get("token");

  if (!token || provided !== token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    throw new Error("FindBack PH Sentry test — if you see this in Sentry, monitoring works! 🎉");
  } catch (e) {
    const Sentry = await import("@sentry/nextjs");
    const eventId = Sentry.captureException(e);
    // Give the SDK a moment to flush the event before responding.
    await Sentry.flush(2000).catch(() => {});
    return NextResponse.json({
      ok: true,
      eventId,
      message: "Test error reported to Sentry. Check your Sentry dashboard for this event ID.",
    });
  }
}
