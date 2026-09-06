import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Ingest endpoint for browser product analytics (see supabase/105-product-events.sql).
 * Validates and size-caps everything before insert; attaches the signed-in
 * user id (if any) and the request user agent server-side so clients can't
 * forge them.
 */

const MAX_BATCH = 10;
const MAX_PROPS_BYTES = 2048;

type IncomingEvent = {
  event_name?: unknown;
  area?: unknown;
  path?: unknown;
  session_id?: unknown;
  props?: unknown;
};

function str(v: unknown, max: number): string | null {
  return typeof v === "string" && v.length > 0 ? v.slice(0, max) : null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { events?: IncomingEvent[] };
    const incoming = Array.isArray(body?.events) ? body.events.slice(0, MAX_BATCH) : [];
    if (incoming.length === 0) {
      return NextResponse.json({ ok: true, inserted: 0 });
    }

    const rows = [];
    for (const e of incoming) {
      const name = str(e.event_name, 64);
      const area = str(e.area, 32);
      if (!name || !area) continue;

      // props must be a small flat JSON object of primitives.
      let props: Record<string, unknown> = {};
      if (e.props && typeof e.props === "object" && !Array.isArray(e.props)) {
        props = e.props as Record<string, unknown>;
        if (JSON.stringify(props).length > MAX_PROPS_BYTES) props = { truncated: true };
      }

      rows.push({
        event_name: name,
        area: area,
        path: str(e.path, 256),
        session_id: str(e.session_id, 64),
        props,
      });
    }

    if (rows.length === 0) {
      return NextResponse.json({ ok: true, inserted: 0 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userAgent = request.headers.get("user-agent")?.slice(0, 200) ?? null;

    const { error } = await supabase.from("product_events").insert(
      rows.map((r) => ({ ...r, user_id: user?.id ?? null, user_agent: userAgent })) as never
    );
    if (error) {
      return NextResponse.json({ ok: false }, { status: 200 }); // never surface DB noise
    }
    return NextResponse.json({ ok: true, inserted: rows.length });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
