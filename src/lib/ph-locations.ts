/**
 * Philippine map constants + a lightweight city -> coordinates lookup.
 *
 * The interactive maps (report pin picker + search map view) are locked to the
 * Philippine bounding box, and every saved coordinate is validated against
 * PH_LAT_RANGE / PH_LNG_RANGE server-side so a report can never pin itself
 * outside the country.
 *
 * The city lookup is intentionally static (no geocoding API): reports created
 * before the map pin feature only have a city name, and we still want them to
 * appear on the search map, so we fall back to a city centroid. Accuracy is
 * "somewhere in this city" — consistent with the product's stance of never
 * exposing exact addresses.
 */

/** Center of the Philippine archipelago. */
export const PH_CENTER: [number, number] = [12.8797, 121.774];

/**
 * Bounding box around the Philippines: [[south, west], [north, east]].
 * Generous padding so pan/zoom never feels clipped, but Bakun (DR Congo)
 * can never wander in.
 */
export const PH_BOUNDS: [[number, number], [number, number]] = [
  [3.5, 113.0],
  [21.5, 128.5],
];

export const PH_LAT_RANGE: [number, number] = [3.5, 21.5];
export const PH_LNG_RANGE: [number, number] = [113.0, 128.5];

/** Guard used server-side before persisting a user-picked coordinate. */
export function isInPhilippines(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= PH_LAT_RANGE[0] &&
    lat <= PH_LAT_RANGE[1] &&
    lng >= PH_LNG_RANGE[0] &&
    lng <= PH_LNG_RANGE[1]
  );
}

/** Lowercase, strip diacritics/punctuation and the word "city" for matching. */
export function normalizeCityKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\bcity\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** [name, latitude, longitude] — approximate centroids, good enough for a dot on a country map. */
const CITIES: Array<[string, number, number]> = [
  // Metro Manila
  ["Manila", 14.5995, 120.9842],
  ["Quezon", 14.676, 121.0437],
  ["Makati", 14.5547, 121.0244],
  ["Taguig", 14.5176, 121.0509],
  ["Pasig", 14.5995, 121.0544],
  ["Mandaluyong", 14.5794, 121.0359],
  ["Pasay", 14.5528, 121.0019],
  ["Paranaque", 14.4791, 121.0198],
  ["Las Pinas", 14.4445, 120.9939],
  ["Muntinlupa", 14.3813, 121.0441],
  ["Marikina", 14.6379, 121.0946],
  ["Caloocan", 14.76, 120.98],
  ["Malabon", 14.6647, 120.956],
  ["Navotas", 14.6675, 120.9421],
  ["Valenzuela", 14.6833, 120.9833],
  ["San Juan", 14.6042, 121.03],
  ["Pateros", 14.5439, 121.0653],
  // Northern / Central Luzon
  ["Antipolo", 14.5878, 121.176],
  ["Baguio", 16.4023, 120.596],
  ["Olongapo", 14.8312, 120.2853],
  ["Angeles", 15.1451, 120.5887],
  ["San Fernando", 15.0393, 120.6896],
  ["Tarlac", 15.4755, 120.5977],
  ["Cabanatuan", 15.4896, 120.9737],
  ["Malolos", 14.8431, 120.8132],
  ["Meycauayan", 14.7366, 120.8789],
  ["Batangas", 13.7565, 121.0583],
  ["Lipa", 13.9411, 121.1631],
  ["Tanauan", 14.0864, 121.1494],
  ["Calamba", 14.2119, 121.1654],
  ["Santa Rosa", 14.3133, 121.1114],
  ["Lucena", 13.9314, 121.6172],
  ["Legazpi", 13.1391, 123.7438],
  ["Naga", 13.6218, 123.1948],
  ["Iriga", 13.5834, 123.4174],
  ["Sorsogon", 12.9783, 124.006],
  ["Virac", 13.5833, 124.2167],
  ["Vigan", 17.5747, 120.3869],
  ["Laoag", 18.1969, 120.5947],
  ["Tuguegarao", 17.6132, 121.727],
  ["Ilagan", 17.1485, 121.8892],
  ["Santiago", 16.6842, 121.5464],
  ["Baler", 15.7589, 121.5607],
  ["Lingayen", 16.043, 120.2278],
  ["Alaminos", 16.1554, 120.0297],
  ["Urdaneta", 15.9762, 120.5711],
  // Visayas
  ["Iloilo", 10.7202, 122.5621],
  ["Roxas", 11.5853, 122.7527],
  ["Kalibo", 11.7044, 122.3654],
  ["Bacolod", 10.6407, 122.9689],
  ["Tacloban", 11.2442, 125.0042],
  ["Ormoc", 11.0061, 124.6122],
  ["Calbayog", 12.0667, 124.6],
  ["Catbalogan", 11.775, 124.8867],
  ["Borongan", 11.6053, 125.4336],
  ["Maasin", 10.1333, 124.8333],
  ["Cebu", 10.3157, 123.8854],
  ["Mandaue", 10.326, 123.924],
  ["Lapu-Lapu", 10.31, 123.949],
  ["Talisay", 10.244, 123.847],
  ["Dumaguete", 9.3068, 123.305],
  ["Tagbilaran", 9.6497, 123.8529],
  ["Puerto Princesa", 9.7392, 118.7354],
  // Mindanao
  ["Davao", 7.1907, 125.4553],
  ["Tagum", 7.4483, 125.8068],
  ["Mati", 6.9583, 126.2136],
  ["Digos", 6.7497, 125.3572],
  ["Cagayan de Oro", 8.4822, 124.6472],
  ["Iligan", 8.228, 124.231],
  ["Ozamiz", 8.1474, 123.7989],
  ["Zamboanga", 6.9214, 122.079],
  ["Dapitan", 8.6561, 123.4225],
  ["Dipolog", 8.5843, 123.34],
  ["Pagadian", 7.8257, 123.437],
  ["General Santos", 6.1164, 125.1716],
  ["Koronadal", 6.5031, 124.8469],
  ["Butuan", 8.9492, 125.5429],
  ["Cabadbaran", 9.1169, 125.5483],
  ["Surigao", 9.7859, 125.4945],
  ["Tandag", 9.0731, 126.1986],
  ["Kidapawan", 7.0083, 125.0894],
  ["Marawi", 8.0, 124.2833],
  ["Cotabato", 7.2236, 124.2464],
  ["Isabela", 6.7044, 121.9712],
  ["Jolo", 6.0533, 121.0024],
  ["Bongao", 5.0286, 119.7725],
];

const CITY_LOOKUP: Map<string, [number, number]> = new Map(
  CITIES.map(([name, lat, lng]) => [normalizeCityKey(name), [lat, lng]])
);

/**
 * Resolve a city name to an approximate Philippine coordinate.
 * Returns null when the city isn't in the lookup (caller should skip the
 * marker rather than guess).
 */
export function lookupCityCoords(
  city: string | null | undefined
): [number, number] | null {
  if (!city) return null;
  const key = normalizeCityKey(city);
  if (!key) return null;
  return CITY_LOOKUP.get(key) ?? null;
}
