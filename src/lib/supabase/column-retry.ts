/**
 * Best-effort recovery for live databases whose schema lags the app: detect
 * the column PostgREST/Postgres complains about and let the caller retry
 * without it. Handles:
 *  - PGRST204: Could not find the 'x' column of 't' in the schema cache
 *  - 42703:    column t.x does not exist
 */
export function parseMissingColumn(
  err: { code?: string; message?: string } | null | undefined
): string | null {
  if (!err?.code || !err.message) return null;
  if (err.code === "PGRST204") {
    return err.message.match(/'([^']+)'\s+column/i)?.[1] ?? null;
  }
  if (err.code === "42703") {
    // "column lost_items.color does not exist" -> "color"
    return err.message.match(/column\s+(?:[\w.]+\.)?([\w]+)\s+does not exist/i)?.[1] ?? null;
  }
  return null;
}

/**
 * Run a Supabase insert/update with a row, dropping any column the live
 * database reports as missing and retrying (up to 6 times). Never drops
 * columns the DB doesn't complain about; unknown failures are returned as-is.
 */
export async function mutateWithColumnRetry<T>(
  run: (row: Record<string, unknown>) => Promise<{ data: T | null; error: unknown }>,
  payload: Record<string, unknown>
): Promise<{ data: T | null; error: unknown }> {
  let row = { ...payload };
  for (let attempt = 0; attempt < 6; attempt++) {
    const result = await run(row);
    if (!result.error) return { data: result.data, error: null };

    const err = result.error as { code?: string; message?: string };
    const missing = parseMissingColumn(err);
    if (!missing || !(missing in row)) {
      console.error("mutate failed:", err.code, err.message);
      return { data: result.data, error: result.error };
    }
    const { [missing]: _dropped, ...rest } = row;
    row = rest;
  }
  return { data: null, error: new Error("column-retry exhausted") };
}