/**
 * Client-side reverse geocoding for the report wizard's map pin.
 *
 * The map picker returns raw coordinates; this turns them into a readable
 * "City, Province" label (e.g. "Davao City, Davao del Sur") using OSM
 * Nominatim's /reverse endpoint. Nominatim is already allowed in the CSP
 * `connect-src` list alongside the tile servers.
 *
 * Never throws — failures resolve to null so the UI can fall back to showing
 * the raw coordinates.
 */

export type PinPlace = { city: string; province: string };

export async function reverseGeocodePhilippines(
  lat: number,
  lng: number
): Promise<PinPlace | null> {
  try {
    const url =
      "https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14" +
      `&countrycodes=ph&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: Record<string, string> } | null;
    const a = data?.address;
    if (!a) return null;
    // City-level granularity: Nominatim names differ by settlement type.
    const city =
      a.city ?? a.town ?? a.municipality ?? a.village ?? a.county ?? "";
    // Nominatim's "state" holds the Philippine province (or "Metro Manila").
    const province = a.state ?? a.province ?? "";
    if (!city && !province) return null;
    return { city, province };
  } catch {
    return null;
  }
}
