"use client";

/**
 * Philippines map (MapLibre GL) used in two places:
 *
 *  - mode="pick"  → the report wizard's "Pin exact location" picker. Click the
 *    map (or drag the pin) to choose a spot; picked pins are clamped to the
 *    Philippine bounding box.
 *  - mode="view"  → the search page's map view: LOST (red) / FOUND (green)
 *    markers with a legend and small popups.
 *
 * The map is a flat, Philippines-only view like a classic web map: only the
 * archipelago is drawn on the basemap texture; everything outside is flat
 * ocean blue (no borders or outlines). Fitted to the Philippines on first
 * load; zoom, pan, search and markers all behave normally afterwards.
 *
 * Loaded via next/dynamic with ssr:false (see philippines-map.tsx) because
 * MapLibre needs `window`.
 */

import * as maplibregl from "maplibre-gl";
import {
  Map as MlMap,
  Marker as MlMarker,
  Popup as MlPopup,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { format, isValid } from "date-fns";
import type { FeatureCollection as GeoJsonFeatureCollection } from "geojson";
import { useEffect, useRef, useState } from "react";
import { PH_BOUNDS } from "@/lib/ph-locations";

export type MapPoint = {
  id: string;
  kind: "lost" | "found";
  lat: number;
  lng: number;
  title: string;
  city: string | null;
  province: string | null;
  href: string;
  /** Report date (ISO string) — shown as "Lost: Aug 26, 2026" in popups. */
  date?: string | null;
};

export type PhilippinesMapProps =
  | {
      mode: "pick";
      latitude: number | null;
      longitude: number | null;
      onPick: (lat: number, lng: number) => void;
    }
  | {
      mode: "view";
      points: MapPoint[];
    };

// Basemap: CARTO "Voyager" raster tiles at @2x retina resolution — vivid
// colors (yellow highways, white streets, green parks, blue water) with every
// street label drawn. The @2x (512px) images are served for the same tile grid,
// so the map stays perfectly sharp on high-DPI screens at every zoom level.
// CARTO's CDN was verified reachable from this network (unlike the previous
// vector-tile provider, whose tiles were blocked and left the map blank).
const CARTO_SUBDOMAINS = ["a", "b", "c", "d"] as const;
const VOYAGER_TILES = CARTO_SUBDOMAINS.map(
  (s) =>
    `https://${s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png`,
);
const SATELLITE_TILES = [
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
];
// The mask over the rest of the world uses the same ocean blue as the style's
// water so the sea blends seamlessly.
const OCEAN_COLOR = "#aad3df";

/**
 * Inline MapLibre style: two raster basemaps (street map + satellite) so the
 * Map/Satellite toggle simply flips layer visibility. Ocean-blue background
 * matches the Philippines-only mask painted on top.
 */
const BASEMAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: VOYAGER_TILES,
      tileSize: 512,
      maxzoom: 20,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    },
    satellite: {
      type: "raster",
      tiles: SATELLITE_TILES,
      tileSize: 256,
      maxzoom: 19,
      attribution: "Imagery &copy; Esri",
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": OCEAN_COLOR },
    },
    { id: "osm", type: "raster", source: "osm" },
    {
      id: "satellite",
      type: "raster",
      source: "satellite",
      layout: { visibility: "none" },
    },
  ],
};

const MAX_ZOOM = 19;
// Tight initial frame around Luzon / Visayas / Mindanao (lng, lat pairs).
const INITIAL_BOUNDS: [[number, number], [number, number]] = [
  [118.9, 4.8],
  [126.3, 19.6],
];
// Hard geographic limit for pan/zoom (lng, lat pairs) — the same Philippine
// bounding box used everywhere else, so the map can never be dragged into
// neighbouring countries.
const MAP_MAX_BOUNDS: [[number, number], [number, number]] = [
  [113.0, 3.5],
  [128.5, 21.5],
];

// --- Philippines-only mask ---------------------------------------------------
//
// Like the reference picture: ONLY the Philippine archipelago is drawn on the
// map texture; everything outside is flat ocean blue. Implemented as a MapLibre
// "donut" fill — a world-covering rectangle with each Philippine island ring
// as a hole. No outlines or borders are drawn.

type Ring = [number, number][];
type PhFeature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: { type: "Polygon"; coordinates: Ring[] };
};
type PhFeatureCollection = { type: "FeatureCollection"; features: PhFeature[] };

// geoBoundaries ADM0 (country outline) — official boundary, all islands.
const PH_BOUNDARY_URL =
  "https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/main/releaseData/gbOpen/PHL/ADM0/geoBoundaries-PHL-ADM0_simplified.geojson";
// Fallback: Natural Earth 50m countries (filtered to PHL client-side).
const PH_BOUNDARY_FALLBACK_URL =
  "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson";

/** Outer rings of every Philippine island polygon (cached per session). */
let phBoundaryRings: Ring[] | null = null;

function polygonOuterRings(geometry: {
  type?: string;
  coordinates?: unknown;
}): Ring[] {
  const coords = geometry?.coordinates as Ring[] | Ring[][] | undefined;
  if (geometry?.type === "Polygon" && Array.isArray(coords)) {
    return [coords[0] as Ring];
  }
  if (geometry?.type === "MultiPolygon" && Array.isArray(coords)) {
    return (coords as Ring[][]).map((part) => part[0]);
  }
  return [];
}

/** Signed-area winding test: +1 counter-clockwise, -1 clockwise. */
function ringAreaSign(ring: Ring): number {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    sum += (ring[i][0] - ring[i + 1][0]) * (ring[i][1] + ring[i + 1][1]);
  }
  return sum > 0 ? 1 : -1;
}

async function loadPhBoundaryRings(): Promise<Ring[]> {
  if (phBoundaryRings) return phBoundaryRings;
  for (const url of [PH_BOUNDARY_URL, PH_BOUNDARY_FALLBACK_URL]) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const geojson = (await res.json()) as {
        type: string;
        features?: Array<{
          geometry?: { type?: string; coordinates?: unknown };
          properties?: Record<string, unknown>;
        }>;
      };
      const features =
        geojson.type === "FeatureCollection" ? (geojson.features ?? []) : [];
      const rings: Ring[] = [];
      for (const feature of features) {
        // The Natural Earth fallback contains every country — keep PHL only.
        const props = feature.properties ?? {};
        const iso = String(
          props.iso_a3 ?? props.ISO_A3 ?? props.ADM0_A3 ?? props.adm0_a3 ?? "",
        ).toUpperCase();
        if (iso && iso !== "PHL") continue;
        rings.push(...polygonOuterRings(feature.geometry ?? {}));
      }
      if (rings.length) {
        phBoundaryRings = rings;
        return rings;
      }
    } catch {
      // Try the next source; a failed mask must never break the map.
    }
  }
  return [];
}

/**
 * Instant, offline fallback mask — needs NO network. Paints a rectangle over
 * the Borneo / Sabah / Brunei / Kalimantan land that is visible inside the
 * map's max bounds (MAP_MAX_BOUNDS). Everything south-west of the Sulu Sea is
 * non-Philippine territory, so covering lng ≤ 119.3 & lat ≤ 7.4 hides it all
 * (Kudat, Kota Kinabalu, Sandakan, Brunei, Nunukan…) without touching
 * Tawi-Tawi (≈119.3–122 E, 4.5–6.5 N) or Palawan. Taiwan/China/Vietnam are
 * outside MAP_MAX_BOUNDS, so they can never be seen anyway.
 */
const FALLBACK_MASK_RECTS: Ring[] = [
  [
    [112.9, 3.4],
    [119.3, 3.4],
    [119.3, 7.4],
    [112.9, 7.4],
  ],
];

/**
 * Paint the offline fallback rectangle immediately. Runs synchronously with
 * local data so Malaysia/Borneo is hidden from the very first frame, even if
 * the remote boundary download is slow or blocked.
 */
/**
 * The fallback mask is painted as soon as the style loads (addFallbackMask
 * below), so it appears from the very first frame. This function re-adds it
 * if the style was swapped and the layer went missing.
 */
function addFallbackMask(map: MlMap) {
  try {
    if (map.getLayer("ph-mask-fallback")) return;
    if (!map.getSource("ph-mask-fallback-source")) {
      const fallback: PhFeatureCollection = {
        type: "FeatureCollection",
        features: FALLBACK_MASK_RECTS.map((ring) => ({
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [ring] },
        })),
      };
      map.addSource("ph-mask-fallback-source", {
        type: "geojson",
        data: fallback as unknown as GeoJsonFeatureCollection,
      });
    }
    map.addLayer({
      id: "ph-mask-fallback",
      type: "fill",
      source: "ph-mask-fallback-source",
      paint: { "fill-color": OCEAN_COLOR, "fill-opacity": 1 },
    });
  } catch {
    // Cosmetic only — never break the map because the mask failed.
  }
}

function removeFallbackMask(map: MlMap) {
  try {
    if (map.getLayer("ph-mask-fallback")) map.removeLayer("ph-mask-fallback");
    if (map.getSource("ph-mask-fallback-source")) {
      map.removeSource("ph-mask-fallback-source");
    }
  } catch {
    // Ignore — the detailed mask below fully covers the same area anyway.
  }
}

/** World-covering rectangle used as the mask polygon's outer ring. */
const WORLD_RING: Ring = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
];

/**
 * Paint over everything outside the Philippine boundary with flat ocean blue
 * so ONLY the archipelago shows on the basemap — exactly like the reference
 * picture. No outline, no borders. Works for the Map and Satellite basemaps.
 */
async function addPhilippinesMask(map: MlMap) {
  try {
    const remoteRings = await loadPhBoundaryRings();
    // Remote boundary failed? Fall back to the built-in Borneo rectangle so
    // Malaysia / Sabah / Brunei never leak onto the map.
    const rings = remoteRings.length ? remoteRings : FALLBACK_MASK_RECTS;
    if (!map.isStyleLoaded()) return;
    if (map.getLayer("ph-mask")) return;

    if (remoteRings.length) {
      // MapLibre fills with the non-zero winding rule: the hole rings must wind
      // in the OPPOSITE direction to the outer ring, otherwise the "holes" fill
      // in and neighbouring land (Sabah, Borneo, Taiwan...) stays visible.
      const sign = ringAreaSign(WORLD_RING);
      const mask: PhFeatureCollection = {
        type: "FeatureCollection",
        features: rings.map((ring) => ({
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [
              WORLD_RING,
              ringAreaSign(ring) === sign ? [...ring].reverse() : ring,
            ],
          },
        })),
      };

      map.addSource("ph-mask-source", {
        type: "geojson",
        data: mask as unknown as GeoJsonFeatureCollection,
      });
    } else {
      const fallback: PhFeatureCollection = {
        type: "FeatureCollection",
        features: rings.map((ring) => ({
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [ring] },
        })),
      };
      map.addSource("ph-mask-source", {
        type: "geojson",
        data: fallback as unknown as GeoJsonFeatureCollection,
      });
    }
    map.addLayer({
      id: "ph-mask",
      type: "fill",
      source: "ph-mask-source",
      paint: { "fill-color": OCEAN_COLOR, "fill-opacity": 1 },
    });
    if (remoteRings.length) {
      // The detailed mask supersedes the instant fallback rectangle.
      removeFallbackMask(map);
    }
  } catch {
    // Cosmetic only — never break the map because the mask failed.
  }
}

/** Philippines geocoding (street / barangay / city search) via Nominatim,
 * hard-bounded to the PH bounding box. */
async function searchPhilippinesPlaces(
  query: string,
): Promise<Array<{ name: string; lat: number; lon: number }>> {
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6" +
    "&countrycodes=ph&viewbox=113,3.5,129,21.5&bounded=1" +
    `&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;
  return data.map((d) => ({
    name: d.display_name,
    lat: Number.parseFloat(d.lat),
    lon: Number.parseFloat(d.lon),
  }));
}

/** Clamp a picked coordinate into the Philippine bounding box. */
function clampToPhilippines(lat: number, lng: number): [number, number] {
  const [[south, west], [north, east]] = PH_BOUNDS;
  return [
    Math.min(north, Math.max(south, lat)),
    Math.min(east, Math.max(west, lng)),
  ];
}

/** Escape user-supplied strings before injecting them into popup HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PIN_SVG =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

/** DOM element for the pick-mode pin (blue, draggable). */
function pickPinElement(): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText =
    "display:flex;width:34px;height:34px;align-items:center;justify-content:center;" +
    "border-radius:9999px;background:#2563eb;border:3px solid #fff;" +
    "box-shadow:0 4px 12px rgba(0,0,0,.35);cursor:grab";
  el.innerHTML = PIN_SVG;
  return el;
}

/** DOM element for a small LOST (red) / FOUND (green) dot marker. */
function dotPinElement(kind: "lost" | "found"): HTMLElement {
  const el = document.createElement("div");
  const color = kind === "lost" ? "#f43f5e" : "#10b981";
  el.style.cssText =
    "display:block;width:16px;height:16px;border-radius:9999px;" +
    `background:${color};border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.4);cursor:pointer`;
  return el;
}

/** "Lost" / "Found" place line for a marker (city, province or fallback). */
function pointPlace(point: MapPoint): string {
  return [point.city, point.province].filter(Boolean).join(", ") || "Philippines";
}

/** Human date ("Aug 26, 2026") for a report, or null when absent/invalid. */
function formatDate(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  return isValid(d) ? format(d, "MMM d, yyyy") : null;
}

/** Popup HTML for a LOST/FOUND report marker. */
function pointPopupHtml(point: MapPoint): string {
  const place = pointPlace(point);
  const when = formatDate(point.date);
  const badge =
    point.kind === "lost"
      ? "background:#fee2e2;color:#be123c"
      : "background:#d1fae5;color:#047857";
  const label = point.kind === "lost" ? "Lost" : "Found";
  return (
    `<div style="min-width:160px;font-family:inherit">` +
    `<p style="margin:0;font-size:14px;font-weight:600;color:#0f172a">${escapeHtml(point.title)}</p>` +
    `<p style="margin:2px 0 0;font-size:12px;color:#64748b">${escapeHtml(place)}</p>` +
    `<p style="margin:6px 0 0"><span style="display:inline-flex;align-items:center;border-radius:9999px;padding:2px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;${badge}">${label}</span></p>` +
    (when
      ? `<p style="margin:6px 0 0;font-size:11px;color:#94a3b8">${label}: ${escapeHtml(when)}</p>`
      : "") +
    `<a href="${escapeHtml(point.href)}" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:#2563eb;text-decoration:none">View report &rarr;</a>` +
    `</div>`
  );
}

export default function PhilippinesMapImpl(props: PhilippinesMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const pickMarkerRef = useRef<MlMarker | null>(null);
  const viewMarkersRef = useRef<Array<{ marker: MlMarker; el: HTMLElement; point: MapPoint }>>(
    [],
  );
  const clusterMarkersRef = useRef<MlMarker[]>([]);
  const onPickRef = useRef(props.mode === "pick" ? props.onPick : undefined);
  const [mapReady, setMapReady] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ name: string; lat: number; lon: number }>
  >([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  // View mode: LOST/FOUND filter + mobile bottom-sheet selection.
  const [filter, setFilter] = useState<"all" | "lost" | "found">("all");
  const [selected, setSelected] = useState<MapPoint | null>(null);

  // Keep the latest onPick without re-creating the map on every render.
  onPickRef.current = props.mode === "pick" ? props.onPick : undefined;

  // --- Map lifecycle -------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      maxZoom: MAX_ZOOM,
      // Flat Philippines-only map like the reference picture: the initial
      // fitBounds frames the archipelago and panning can never leave the
      // Philippine bounding box.
      maxBounds: MAP_MAX_BOUNDS,
      center: [121.5, 12.5],
      zoom: 4.6,
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: false }),
      "top-left",
    );
    map.addControl(
      new maplibregl.ScaleControl({ unit: "metric" }),
      "bottom-left",
    );
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );

    // Frame the whole Philippines as soon as the map is ready, then paint the
    // outside-the-archipelago mask (flat ocean blue).
    const onReady = () => {
      setMapReady(true);
      map.fitBounds(INITIAL_BOUNDS, { padding: 12, duration: 0 });
      // Hide Malaysia/Borneo on the very first frame, then swap in the
      // detailed archipelago mask when the remote boundary arrives.
      addFallbackMask(map);
      void addPhilippinesMask(map);
    };
    if (map.isStyleLoaded()) onReady();
    else map.once("load", onReady);

    // If the style ever reloads, the mask layer is wiped — re-apply it.
    map.on("styledata", () => {
      if (map.isStyleLoaded() && !map.getLayer("ph-mask")) {
        addFallbackMask(map);
        void addPhilippinesMask(map);
      }
    });

    // Pick mode: click anywhere to drop / move the pin (clamped to PH).
    const onClick = (e: maplibregl.MapMouseEvent) => {
      if (props.mode !== "pick") return;
      const [lat, lng] = clampToPhilippines(e.lngLat.lat, e.lngLat.lng);
      onPickRef.current?.(lat, lng);
      if (map.getZoom() < MAX_ZOOM) {
        map.flyTo({
          center: e.lngLat,
          zoom: Math.min(map.getZoom() + 3, MAX_ZOOM),
          duration: 800,
        });
      }
    };
    map.on("click", onClick);

    // Re-measure when the container resizes (wizard steps / reveal effects).
    const container = containerRef.current;
    const resize = () => map.resize();
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(resize);
    });
    ro.observe(container);
    ro.observe(container.parentElement ?? container);
    const timeouts = [100, 300, 600, 1200].map((t) =>
      window.setTimeout(resize, t),
    );
    const onWindowResize = () => resize();
    window.addEventListener("resize", onWindowResize);

    return () => {
      map.off("click", onClick);
      ro.disconnect();
      timeouts.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("resize", onWindowResize);
      map.remove();
      mapRef.current = null;
    };
    // Mode never changes for a mounted instance (keyed by the callers).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

    // --- View mode: LOST / FOUND report markers ------------------------------
  const allPoints = props.mode === "view" ? props.points : [];
  const points =
    filter === "all" ? allPoints : allPoints.filter((p) => p.kind === filter);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || props.mode !== "view") return;
    const gl = map;
    viewMarkersRef.current.forEach(({ marker }) => marker.remove());
    clusterMarkersRef.current.forEach((m) => m.remove());
    viewMarkersRef.current = [];
    clusterMarkersRef.current = [];

    // On phones a tap opens the bottom-sheet card instead of a tiny popup.
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 639px)").matches;

    const entries = points.map((point) => {
      const el = dotPinElement(point.kind);
      const marker = new maplibregl.Marker({ element: el }).setLngLat([
        point.lng,
        point.lat,
      ]);
      if (isMobile) {
        el.addEventListener("click", () => setSelected(point));
      } else {
        marker.setPopup(
          new maplibregl.Popup({ offset: 12 }).setHTML(pointPopupHtml(point)),
        );
      }
      marker.addTo(gl);
      return { marker, el, point };
    });
    viewMarkersRef.current = entries;

    /**
     * Lightweight grid clustering for the existing HTML markers (no extra
     * dependency): nearby markers are hidden and replaced by a single count
     * badge; clicking the badge zooms in so the cluster separates.
     */
    const CELL_PX = 44;
    function updateClusters() {
      clusterMarkersRef.current.forEach((m) => m.remove());
      clusterMarkersRef.current = [];
      entries.forEach((e) => {
        e.el.style.display = "";
        e.marker.getPopup()?.remove();
      });

      const groups = new Map<string, typeof entries>();
      for (const e of entries) {
        const p = gl.project([e.point.lng, e.point.lat]);
        const key = `${Math.floor(p.x / CELL_PX)}:${Math.floor(p.y / CELL_PX)}`;
        let group = groups.get(key);
        if (!group) {
          group = [];
          groups.set(key, group);
        }
        group.push(e);
      }

      for (const group of groups.values()) {
        if (group.length < 2) continue;
        group.forEach((e) => {
          e.el.style.display = "none";
        });
        const lng =
          group.reduce((s, e) => s + e.point.lng, 0) / group.length;
        const lat =
          group.reduce((s, e) => s + e.point.lat, 0) / group.length;
        const el = document.createElement("div");
        el.style.cssText =
          "display:flex;min-width:26px;height:26px;padding:0 7px;" +
          "align-items:center;justify-content:center;border-radius:9999px;" +
          "background:#1e293b;color:#fff;font-size:11px;font-weight:700;" +
          "border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.4);cursor:pointer";
        el.setAttribute("aria-label", `${group.length} reports`);
        el.textContent = String(group.length);
        el.addEventListener("click", () => {
          gl.easeTo({
            center: [lng, lat],
            zoom: Math.min(gl.getZoom() + 2, MAX_ZOOM),
            duration: 500,
          });
        });
        clusterMarkersRef.current.push(
          new maplibregl.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(gl),
        );
      }
    }
    updateClusters();
    gl.on("moveend", updateClusters);

    return () => {
      gl.off("moveend", updateClusters);
      viewMarkersRef.current.forEach(({ marker }) => marker.remove());
      clusterMarkersRef.current.forEach((m) => m.remove());
      viewMarkersRef.current = [];
      clusterMarkersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, points, props.mode]);

  // --- Pick mode: draggable pin follows the picked coordinate --------------
  const pickLat = props.mode === "pick" ? props.latitude : null;
  const pickLng = props.mode === "pick" ? props.longitude : null;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || props.mode !== "pick") return;
    if (pickLat === null || pickLng === null) {
      pickMarkerRef.current?.remove();
      pickMarkerRef.current = null;
      return;
    }
    if (!pickMarkerRef.current) {
      const marker = new maplibregl.Marker({
        element: pickPinElement(),
        draggable: true,
      }).addTo(map);
      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        const [lat, lng] = clampToPhilippines(lngLat.lat, lngLat.lng);
        onPickRef.current?.(lat, lng);
        // Normalise the marker to the clamped position.
        marker.setLngLat([lng, lat]);
      });
      pickMarkerRef.current = marker;
    }
    pickMarkerRef.current.setLngLat([pickLng, pickLat]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, pickLat, pickLng]);

  // --- Search-as-you-type (debounced Nominatim, PH-bounded) ----------------
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    const t = window.setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await searchPhilippinesPlaces(q));
        setSearchOpen(true);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [query]);

  // Auto-dismiss the geolocation error toast after a few seconds.
  useEffect(() => {
    if (!geoError) return;
    const t = window.setTimeout(() => setGeoError(null), 4000);
    return () => window.clearTimeout(t);
  }, [geoError]);

    /** Nudge the map rotation (bearing) by `delta` degrees. */
  function rotateBy(delta: number) {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ bearing: (((map.getBearing() + delta) % 360) + 360) % 360, duration: 200 });
  }

  /** Snap the map back to north-up. */
  function resetBearing() {
    mapRef.current?.easeTo({ bearing: 0, duration: 300 });
  }

  /** Whether a GPS/IP coordinate falls inside the Philippine bounding box. */
  function insidePh(lat: number, lng: number): boolean {
    const [[south, west], [north, east]] = PH_BOUNDS;
    return lat >= south && lat <= north && lng >= west && lng <= east;
  }

  function flyToLocation(lat: number, lng: number, zoom = 17) {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1400 });
    if (props.mode === "pick") props.onPick(lat, lng);
  }

  /** Approximate fallback: locate via the network's public IP (ipapi.co). */
  async function locateByIp() {
    try {
      const res = await fetch("https://ipapi.co/json/", {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as {
        latitude?: number;
        longitude?: number;
      };
      if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
        throw new Error("no coordinates");
      }
      const { latitude, longitude } = data;
      if (!insidePh(latitude, longitude)) {
        setGeoError("You appear to be outside the Philippines");
        return;
      }
      flyToLocation(latitude, longitude, 13);
      setGeoError("Using approximate location from your network");
    } catch {
      setGeoError("Couldn't get your location - allow location access or search instead");
    }
  }

  function locateMe() {
    if (!("geolocation" in navigator) || !window.isSecureContext) {
      // No GPS API, or the page is plain-http: the browser silently blocks
      // geolocation there, so use the IP fallback instead.
      void locateByIp();
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        if (!insidePh(latitude, longitude)) {
          setGeoError("You appear to be outside the Philippines");
          return;
        }
        flyToLocation(latitude, longitude);
      },
      (err) => {
        setLocating(false);
        // GPS failed - fall back to an approximate IP-based location.
        void locateByIp().then(() => {
          if (err.code === err.PERMISSION_DENIED) {
            setGeoError("Location blocked - allow it in your browser, or search your place instead");
          }
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }

  /** Search Philippine streets/places and list suggestions. */
  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      setResults(await searchPhilippinesPlaces(q));
      setSearchOpen(true);
    } finally {
      setSearching(false);
    }
  }

  /** Fly the map to a search result (normal behaviour: smooth move + zoom). */
  function selectResult(r: { lat: number; lon: number }) {
    mapRef.current?.flyTo({ center: [r.lon, r.lat], zoom: 16, duration: 1600 });
    setSearchOpen(false);
  }

    const mapArea = (
    <div className="relative h-full w-full overflow-hidden">
      {/* MapLibre canvas. */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Locate-me + rotate controls — bottom-right. */}
      <div className="absolute bottom-3 right-3 z-[500] flex flex-col gap-1">
        <button
          type="button"
          aria-label="Show my location"
          title="Show my location (GPS)"
          onClick={locateMe}
          disabled={locating}
          className={`flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-blue-600 ${
            locating ? "cursor-wait opacity-70" : ""
          }`}
        >
          {locating ? (
            <span
              aria-hidden="true"
              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"
            />
          ) : (
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          )}
        </button>
        <button
          type="button"
          aria-label="Rotate map left"
          title="Rotate left (right-button drag also works)"
          onClick={() => rotateBy(-15)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white/95 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-blue-600"
        >
          &#8634;
        </button>
        <button
          type="button"
          aria-label="Rotate map right"
          title="Rotate right (right-button drag also works)"
          onClick={() => rotateBy(15)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white/95 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-blue-600"
        >
          &#8635;
        </button>
        <button
          type="button"
          aria-label="Reset map rotation to north"
          title="Reset rotation (north-up)"
          onClick={resetBearing}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white/95 text-[11px] font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-blue-600"
        >
          &#8982;
        </button>
      </div>

      {/* Geolocation error toast (auto-dismisses). */}
      {geoError && (
        <div
          role="status"
          className="absolute bottom-9 left-1/2 z-[600] -translate-x-1/2 whitespace-nowrap rounded-full bg-rose-600 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-lg"
        >
          {geoError}
        </div>
      )}

      {/* Mobile bottom-sheet card — tap a marker on a phone to see the
          report details in a finger-friendly card instead of a tiny popup. */}
      {props.mode === "view" && selected && (
        <div
          role="dialog"
          aria-label={`${selected.kind === "lost" ? "Lost" : "Found"} report`}
          className="absolute inset-x-3 bottom-4 z-[700] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                selected.kind === "lost"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {selected.kind === "lost" ? "🔴 Lost" : "🟢 Found"}
            </span>
            <button
              type="button"
              aria-label="Close report card"
              onClick={() => setSelected(null)}
              className="-mr-1 -mt-1 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {selected.title}
          </p>
          <p className="mt-0.5 text-sm text-slate-500">{pointPlace(selected)}</p>
          {formatDate(selected.date) && (
            <p className="mt-1 text-xs text-slate-400">
              {selected.kind === "lost" ? "Lost" : "Found"}:{" "}
              {formatDate(selected.date)}
            </p>
          )}
          <a
            href={selected.href}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto"
          >
            View Report &rarr;
          </a>
        </div>
      )}

      {/* Hint for the click behaviour in pick mode. */}
      {props.mode === "pick" && (
        <div className="pointer-events-none absolute bottom-9 left-3 z-[500] flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-[10px] font-semibold tracking-wide text-slate-500 shadow-sm">
          <svg
            aria-hidden="true"
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          TAP THE MAP TO PIN YOUR REPORT · DRAG THE PIN TO ADJUST
        </div>
      )}
    </div>
  );

  // View mode: search + filters sit ABOVE the map (per the FindBackPH layout),
  // so only the map controls (zoom, Map/Satellite, My Location) overlay the
  // map itself and nothing overlaps.
  if (props.mode === "view") {
    return (
      <div className="flex h-full w-full flex-col">
        {/* Search + filters, above the map. */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-3 pb-3 pt-3">
          <form onSubmit={runSearch} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a place in the Philippines..."
              aria-label="Search a place in the Philippines"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
            />
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            {searching && (
              <span
                aria-hidden="true"
                className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"
              />
            )}
          </form>

          {/* ALL / LOST / FOUND — horizontally scrollable on small screens. */}
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
            {(
              [
                ["all", "ALL"],
                ["lost", "🔴 LOST"],
                ["found", "🟢 FOUND"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setFilter(value);
                  setSelected(null);
                }}
                aria-pressed={filter === value}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wide transition-colors ${
                  filter === value
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {searchOpen && results.length > 0 && (
            <ul
              role="listbox"
              className="mt-1.5 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            >
              {results.map((r) => (
                <li key={`${r.lat},${r.lon}`}>
                  <button
                    type="button"
                    onClick={() => selectResult(r)}
                    className="block w-full px-3 py-2 text-left text-xs leading-snug text-slate-600 hover:bg-slate-100"
                  >
                    {r.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* The map fills the remaining height. */}
        <div className="relative min-h-0 flex-1">{mapArea}</div>
      </div>
    );
  }

  return mapArea;
}






