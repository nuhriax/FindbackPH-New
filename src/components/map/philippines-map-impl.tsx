"use client";

import * as maplibregl from "maplibre-gl";
import { config as maplibreConfig } from "maplibre-gl";

import {
  Map as MlMap,
  Marker as MlMarker,
  Popup as MlPopup,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { format, isValid } from "date-fns";
import type {
  FeatureCollection as GeoJsonFeatureCollection,
  LineString,
} from "geojson";
import { useEffect, useRef, useState } from "react";
import { PH_BOUNDS } from "@/lib/ph-locations";

// MapLibre GL v6 computes its default worker URL from `import.meta.url`, which
// webpack replaces with the *page* URL in the client bundle — so the spawned
// "worker" is the page's own HTML document. It starts without errors but never
// runs any code, so no tiles are ever fetched and only the style background
// renders (blank beige map). Point WORKER_URL at a real copy of the worker
// script served from /public instead.
if (typeof window !== "undefined" && !maplibreConfig.WORKER_URL) {
  maplibreConfig.WORKER_URL = "/maplibre-gl-worker.mjs";
}

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

// Subtle outside-country dimming: a translucent deep-blue wash that shades
// everything outside the Philippines (Borneo, Sabah, Taiwan…) without hiding
// the topographic terrain beneath. A fully opaque slab would clash with the
// basemap's own ocean color and show hard straight edges over open water.
const OUTSIDE_PH_MASK_COLOR = "#a9c9de";
const OUTSIDE_PH_MASK_OPACITY = 1;

// Professional topographic basemap (terrain with baked-in shaded relief,
// roads, place labels that grow with zoom). These public ArcGIS tiled
// services are Web Mercator raster tiles.
const REALISTIC_TOPO_TILES =
  "https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";
const ESRI_ATTRIBUTION =
  "Tiles & data © Esri, Garmin, GEBCO, NOAA NGDC, and other contributors";

function makeGraticule(): GeoJsonFeatureCollection<LineString> {
  const features: GeoJsonFeatureCollection<LineString>["features"] = [];

  for (const lng of [116, 120, 124, 128]) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [lng, 3],
          [lng, 22],
        ],
      },
    });
  }

  for (const lat of [4, 8, 12, 16, 20]) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [113, lat],
          [130, lat],
        ],
      },
    });
  }

  return { type: "FeatureCollection", features };
}

const REALISTIC_TOPO_STYLE: StyleSpecification = {
  version: 8,
  // Font glyphs for symbol layers (sea-name labels, province labels).
  // Same endpoint the repo already uses in map-test.html.
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    "realistic-topo": {
      type: "raster",
      tiles: [REALISTIC_TOPO_TILES],
      tileSize: 256,
      // Esri World Topo has no tile coverage at z18/z19 in parts of rural PH —
      // requesting those returns gray "Map data not yet available" error boxes.
      // Cap at z17 and let MapLibre overzoom (upscale) the last real tiles; the
      // OSM detail layer fades in above z13 so street-level detail is unaffected.
      maxzoom: 17,
      attribution: ESRI_ATTRIBUTION,
    },
    // Full street-level detail (streets, barangays, POIs) for close zooms —
    // faded in via the `osm-detail` layer so cities show every road when the
    // user zooms in, while the whole country keeps the atlas look.
    "osm-detail": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© OpenStreetMap contributors",
    },

    "sea-names": {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { name: "Philippine Sea" },
            geometry: { type: "Point", coordinates: [127.6, 13.2] },
          },
          {
            type: "Feature",
            properties: { name: "Sulu Sea" },
            geometry: { type: "Point", coordinates: [119.2, 8.6] },
          },
          {
            type: "Feature",
            properties: { name: "South China Sea" },
            geometry: { type: "Point", coordinates: [115.2, 14.2] },
          },
          {
            type: "Feature",
            properties: { name: "Celebes Sea" },
            geometry: { type: "Point", coordinates: [122.6, 4.4] },
          },
          {
            type: "Feature",
            properties: { name: "Luzon Strait" },
            geometry: { type: "Point", coordinates: [121.4, 20.9] },
          },
        ],
      },
    },
    graticule: {
      type: "geojson",
      data: makeGraticule(),
    },
  },
  layers: [
    {
      // Canvas background: matches the topo basemap's paper tone so while
      // tiles stream in you see a neutral map color instead of dark boxes.
      id: "background",
      type: "background",
      paint: { "background-color": "#e8eef0" },
    },
    {
      id: "topographic-base",
      type: "raster",
      source: "realistic-topo",
      paint: {
        "raster-opacity": 1,
        // Premium readability: gently desaturated + slightly contrasted so the
        // red/green report pins and labels always dominate the terrain art.
        "raster-saturation": -0.18,
        "raster-contrast": 0.1,
        "raster-brightness-min": 0.04,
        "raster-brightness-max": 0.99,
        // Instant tile display while panning/zooming: removes the cross-fade
        // flash that makes the map feel sluggish.
        "raster-fade-duration": 0,
      },
    },
    {
      // Street-level OSM detail — invisible at country zooms, faded in once the
      // topographic basemap runs out of road detail so cities show every
      // street, barangay and landmark.
      id: "osm-detail",
      type: "raster",
      source: "osm-detail",
      minzoom: 11,
      paint: {
        "raster-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          13,
          0,
          16,
          1,
        ],
        "raster-fade-duration": 0,
      },
    },
    {
      id: "graticule",
      type: "line",
      source: "graticule",
      minzoom: 3,
      maxzoom: 7,
      paint: {
        "line-color": "#4d8eb6",
        "line-width": 0.8,
        "line-opacity": 0.12,
      },
    },
    {
      id: "sea-labels",
      type: "symbol",
      source: "sea-names",
      layout: {
        visibility: "visible",
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Regular"],
        "text-transform": "uppercase",
        "text-letter-spacing": 0.22,
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          3,
          9,
          6,
          12,
        ],
      },
      minzoom: 3,
      maxzoom: 8,
      paint: {
        "text-color": "#315f87",
        "text-halo-color": "rgba(214, 230, 245, 0.72)",
        "text-halo-width": 1.1,
      },
    },
  ],
};

// OSM raster tiles are kept as an automatic fallback if the OpenFreeMap
// vector tiles can't be fetched (offline dev, CDN outage). OSM's tile usage
// policy allows light use with proper attribution; do not hammer it.
const OSM_TILES = ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"];

/**
 * Fallback inline style (raster OSM source). Only used when the
 * OpenFreeMap basemap fails to load — see the map "error" handler.
 */
const RASTER_FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: OSM_TILES,
      tileSize: 256,
      maxzoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#a9c7dc" },
    },
    { id: "osm", type: "raster", source: "osm" },
  ],
};

// --- Provinces: colored choropleth -------------------------------------------
//
// Each Philippine province gets its own soft pastel color (stable per name) so
// the archipelago reads like a premium "colored map" and provinces are easy to
// tell apart at a glance. Provinces can be hovered (tooltip with the name) and
// clicked (in view mode) to zoom to that province.

// geoBoundaries ADM1 (provinces) — same source family as the ADM0 mask above.
const PH_PROVINCE_URL =
  "https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/main/releaseData/gbOpen/PHL/ADM1/geoBoundaries-PHL-ADM1_simplified.geojson";

// Region-family palette, modelled on a classic PRINTED ATLAS physical map of
// the Philippines: the whole country is drawn in subtle terrain tones
// (beige / khaki / tan / pale olive-green, like shaded relief), with only
// slight shade variation per province so neighbors stay distinguishable
// without breaking the uniform "paper map" look.
const REGION_FAMILIES: Array<{
  test: (lat: number, lng: number) => boolean;
  shades: string[];
}> = [
  // Northern Luzon — slightly greener highlands tone.
  {
    test: (lat) => lat >= 16.0,
    shades: ["#d3d2ac", "#dcdbb8", "#c9c8a0"],
  },
  // Central Luzon + Southern Tagalog mainland — pale khaki.
  {
    test: (lat) => lat >= 13.6,
    shades: ["#ded5b2", "#e5ddc0", "#d4cab4"],
  },
  // Bicol + Masbate — warm parchment.
  {
    test: (lat, lng) => lat >= 12.0 && lng >= 123.4,
    shades: ["#e3d9bb", "#eae1c8", "#d8cdb4"],
  },
  // CALABARZON / MIMAROPA / Palawan — pale olive-gold.
  {
    test: (lat) => lat >= 11.4,
    shades: ["#dcd6ae", "#e3debc", "#d2cc9e"],
  },
  // Visayas — sandy tan.
  {
    test: (lat) => lat >= 9.6,
    shades: ["#e6dcba", "#ede4c6", "#d9ceb0"],
  },
  // Mindanao east (Caraga, northern Davao) — light sand.
  {
    test: (_lat, lng) => lng >= 125.6,
    shades: ["#e9e0be", "#f0e8cc", "#ded4ae"],
  },
  // Mindanao west/south (Zamboanga, Bangsamoro, SOCCSKSARGEN) — warm parchment.
  {
    test: () => true,
    shades: ["#e4d9b6", "#ebe2c4", "#d9ceb0"],
  },
];

/** Stable shade choice within a region family (hash → slot). */
function shadeFor(name: string, shades: string[]): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return shades[Math.abs(h) % shades.length];
}

/** Rough centroid of a polygon feature's outer ring (good enough for banding). */
function centroid(geometry: {
  type: string;
  coordinates: unknown;
}): { lat: number; lng: number } {
  const coords =
    geometry.type === "Polygon"
      ? (geometry.coordinates as number[][][])[0]
      : ((geometry.coordinates as number[][][][])[0]?.[0] ?? []);
  let sx = 0;
  let sy = 0;
  for (const [x, y] of coords) {
    sx += x;
    sy += y;
  }
  const n = coords.length || 1;
  return { lng: sx / n, lat: sy / n };
}

/** Region-family color for a province feature (name + centroid banded). */
function provinceColor(
  name: string,
  geometry: { type: string; coordinates: unknown },
): string {
  const { lat, lng } = centroid(geometry);
  const family = REGION_FAMILIES.find((f) => f.test(lat, lng))!;
  return shadeFor(name, family.shades);
}

/** Province FeatureCollection (cached per session). */
let phProvinceData: GeoJsonFeatureCollection | null = null;

/**
 * Approximate area of a lat/lng polygon ring (shoelace, degrees² — only used
 * comparatively, to pick a province's largest island for its label point).
 */
function ringAreaSq(ring: [number, number][]): number {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  }
  return Math.abs(sum / 2);
}

/** Average of a ring's vertices — good-enough label anchor for a polygon. */
function ringCentroid(ring: [number, number][]): [number, number] {
  let x = 0;
  let y = 0;
  for (const [lng, lat] of ring) {
    x += lng;
    y += lat;
  }
  return [x / Math.max(ring.length, 1), y / Math.max(ring.length, 1)];
}

/**
 * One label point per province, anchored at the centroid of its LARGEST
 * polygon — so multi-island provinces (ARMM, MIMAROPA…) get a single label
 * instead of one per islet.
 */
function provinceLabelPoints(data: GeoJsonFeatureCollection): GeoJsonFeatureCollection {
  const best = new Map<string, { area: number; lng: number; lat: number }>();
  for (const feature of data.features) {
    const name = String(
      feature.properties?.shapeName ??
        feature.properties?.name ??
        feature.properties?.NAME_1 ??
        "",
    );
    if (!name) continue;
    const geometry = feature.geometry as {
      type: string;
      coordinates: unknown;
    } | null;
    if (!geometry) continue;
    const rings: [number, number][][] =
      geometry.type === "Polygon"
        ? [(geometry.coordinates as unknown[])[0] as [number, number][]]
        : geometry.type === "MultiPolygon"
          ? (geometry.coordinates as [number, number][][][]).map(
              (poly) => poly[0] as [number, number][],
            )
          : [];
    for (const ring of rings) {
      if (!Array.isArray(ring) || ring.length < 3) continue;
      const area = ringAreaSq(ring);
      const prev = best.get(name);
      if (!prev || area > prev.area) {
        const [lng, lat] = ringCentroid(ring);
        best.set(name, { area, lng, lat });
      }
    }
  }
  return {
    type: "FeatureCollection",
    features: [...best.entries()].map(([name, p]) => ({
      type: "Feature",
      properties: { name },
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
    })),
  };
}

async function loadProvinceGeojson(): Promise<GeoJsonFeatureCollection | null> {
  if (phProvinceData) return phProvinceData;
  try {
    const res = await fetch(PH_PROVINCE_URL);
    if (!res.ok) return null;
    const geojson = (await res.json()) as GeoJsonFeatureCollection & {
      features?: Array<{
        properties?: Record<string, unknown>;
      }>;
    };
    if (geojson?.type !== "FeatureCollection" || !geojson.features?.length)
      return null;
    for (const feature of geojson.features) {
      const name = String(
        feature.properties?.shapeName ??
          feature.properties?.name ??
          feature.properties?.NAME_1 ??
          "",
      );
      (feature.properties ??= {}).color = provinceColor(
        name,
        feature.geometry as { type: string; coordinates: unknown },
      );
    }
    phProvinceData = geojson;
    return geojson;
  } catch {
    return null; // Cosmetic layer — a failed download must never break the map.
  }
}

const MAX_ZOOM = 19;
const PHILIPPINES_OVERVIEW_MAX_ZOOM = 4.1;
// Initial frame covering the ENTIRE archipelago — Batanes in the north
// (~21.2 N), Tawi-Tawi in the south (~4.5 N), Benham Rise east, Spratlys west
// — so no part of the country is ever cropped on first load (lng, lat pairs).
const INITIAL_BOUNDS: [[number, number], [number, number]] = [
  [116.0, 3.9],
  [128.0, 21.4],
];
// Hard geographic limit for pan/zoom (lng, lat pairs) — the same Philippine
// bounding box used everywhere else, so the map can never be dragged into
// neighbouring countries.
const MAP_MAX_BOUNDS: [[number, number], [number, number]] = [
  [115.8, 3.8],
  [128.2, 21.6],
];

// --- Philippines-only mask ---------------------------------------------------
//
// The boundary mask softly dims everything outside the Philippine archipelago.
// This preserves the realistic topographic context (Malaysia, Borneo, Taiwan,
// etc.) while keeping FindBackPH focused on the Philippines.

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
        tolerance: 0,
        buffer: 0,
      });
    }
    map.addLayer({
      id: "ph-mask-fallback",
      type: "fill",
      source: "ph-mask-fallback-source",
      paint: {
        "fill-color": OUTSIDE_PH_MASK_COLOR,
        "fill-opacity": OUTSIDE_PH_MASK_OPACITY,
      },
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
  [-180, -85],
];

/**
 * Dim the area outside the Philippine boundary so the realistic topographic
 * basemap remains visible around the archipelago, while the Philippines stays
 * visually dominant. No hard outline is drawn.
 */
async function addPhilippinesMask(map: MlMap) {
  try {
    const remoteRings = await loadPhBoundaryRings();
    // A rectangular fallback creates visible straight-edged blocks over the
    // ocean. Leave the basemap untouched until the real boundary is ready.
    if (!remoteRings.length) return;
    const rings = remoteRings;
    if (!map.isStyleLoaded()) return;
    if (map.getLayer("ph-mask")) return;

    if (remoteRings.length) {
      // MapLibre fills with the non-zero winding rule: the hole rings must wind
      // in the OPPOSITE direction to the outer ring, otherwise the "holes" fill
      // in and neighbouring land (Sabah, Borneo, Taiwan...) stays visible.
      //
      // IMPORTANT: this must be a SINGLE polygon whose outer ring is WORLD_RING
      // with every island as a hole. Making one feature per island (each with
      // its own WORLD_RING outer) paints a full world rectangle per island and
      // blanks the entire map.
      const sign = ringAreaSign(WORLD_RING);
      // Drop degenerate rings and make sure every hole is properly closed —
      // open rings break the fill triangulation in some tiles.
      const holes = rings
        .filter((ring) => ring.length >= 4)
        .map((ring) => {
          const first = ring[0];
          const last = ring[ring.length - 1];
          const closed =
            first[0] === last[0] && first[1] === last[1]
              ? ring
              : [...ring, first];
          return ringAreaSign(closed) === sign ? [...closed].reverse() : closed;
        });
      const mask: PhFeatureCollection = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [WORLD_RING, ...holes],
            },
          },
        ],
      };

      map.addSource("ph-mask-source", {
        type: "geojson",
        data: mask as unknown as GeoJsonFeatureCollection,
        // Disable Douglas-Peucker simplification (it creates self-intersecting
        // rings that break the nonzero winding fill), but KEEP a positive
        // buffer: buffer 0 clips hole rings exactly at tile boundaries, which
        // yields open/degenerate rings that fail triangulation in individual
        // tiles — visible as straight-edged rectangular patches on the map.
        tolerance: 0,
        buffer: 64,
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
        tolerance: 0,
        buffer: 64,
      });
    }
    map.addLayer({
      id: "ph-mask",
      type: "fill",
      source: "ph-mask-source",
      paint: {
        "fill-color": OUTSIDE_PH_MASK_COLOR,
        "fill-opacity": OUTSIDE_PH_MASK_OPACITY,
      },
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
  return data
    .map((d) => ({
      name: concisePlaceName(d.display_name),
      lat: Number.parseFloat(d.lat),
      lon: Number.parseFloat(d.lon),
    }))
    .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lon));
}

function concisePlaceName(displayName: string): string {
  const parts = displayName
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.slice(0, 3).join(", ") || displayName;
}

/** Clamp a picked coordinate into the Philippine bounding box. */
function clampToPhilippines(lat: number, lng: number): [number, number] {
  const [[south, west], [north, east]] = PH_BOUNDS;
  return [
    Math.min(north, Math.max(south, lat)),
    Math.min(east, Math.max(west, lng)),
  ];
}

/** True when a coordinate falls inside one of the Philippine island rings. */
function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }
  return inside;
}

async function isPhilippinesCoordinate(lat: number, lng: number): Promise<boolean> {
  const [[south, west], [north, east]] = PH_BOUNDS;
  if (lat < south || lat > north || lng < west || lng > east) return false;

  const rings = await loadPhBoundaryRings();
  if (!rings.length) return false;
  return rings.some((ring) => pointInRing(lng, lat, ring));
}

/**
 * Decorative compass rose like a printed atlas map — an inert MapLibre
 * control (pure SVG, no interaction) rendered above the scale bar.
 */
function compassRoseControl(): {
  onAdd: (map: MlMap) => HTMLElement;
  onRemove: (map: MlMap) => void;
} {
  let el: HTMLElement | null = null;
  return {
    onAdd() {
      el = document.createElement("div");
      el.className = "fbx-compass-rose";
      el.setAttribute("aria-hidden", "true");
      el.style.cssText =
        "pointer-events:none;margin:6px 0 10px 10px;width:44px;height:56px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.25));";
      el.innerHTML = `
        <svg viewBox="0 0 44 56" width="44" height="56" xmlns="http://www.w3.org/2000/svg">
          <text x="22" y="11" text-anchor="middle" font-family="Georgia, serif" font-size="11" font-weight="bold" fill="#2b2b2b">N</text>
          <g transform="translate(22,33)">
            <polygon points="0,-22 4.5,-4.5 0,0 -4.5,-4.5" fill="#c0392b" stroke="#7a241b" stroke-width="0.6"/>
            <polygon points="0,-22 4.5,-4.5 0,0 0,-22" fill="#e74c3c" stroke="#7a241b" stroke-width="0.6" opacity="0.85"/>
            <polygon points="22,0 4.5,4.5 0,0 4.5,-4.5" fill="#f4f1e8" stroke="#555" stroke-width="0.6"/>
            <polygon points="0,22 -4.5,4.5 0,0 4.5,4.5" fill="#f4f1e8" stroke="#555" stroke-width="0.6"/>
            <polygon points="-22,0 -4.5,-4.5 0,0 -4.5,4.5" fill="#f4f1e8" stroke="#555" stroke-width="0.6"/>
            <circle r="1.6" fill="#2b2b2b"/>
          </g>
        </svg>`;
      return el;
    },
    onRemove() {
      el?.parentNode?.removeChild(el);
      el = null;
    },
  };
}

/**
 * Premium styling for MapLibre chrome: floating-card popups, rounded control
 * groups, and pin animations. Injected once per map instance; scoped to
 * MapLibre class names + our .fbx-* hooks so nothing else is affected.
 */

/**
 * Fetch + draw the colored province layer: pastel fills under the roads and
 * labels, crisp white province outlines, a hover highlight and zoom-readable
 * province name labels.
 */
async function addProvincesLayers(map: MlMap) {
  try {
    if (map.getLayer("ph-provinces-fill")) return;
    // The 3 MB GeoJSON download happens below; the style can flip to
    // "unloaded" while we await it (e.g. during the fallback-style swap).
    // Rather than bailing, wait until it settles before painting.
    if (!map.isStyleLoaded()) {
      await new Promise<void>((resolve) => {
        const done = () => {
          map.off("styledata", done);
          resolve();
        };
        map.on("styledata", done);
      });
    }
    const data = await loadProvinceGeojson();
    if (!data || map.getLayer("ph-provinces-fill")) return;
    if (!map.isStyleLoaded()) {
      await new Promise<void>((resolve) => map.once("idle", () => resolve()));
      if (map.getLayer("ph-provinces-fill")) return;
    }
    if (map.getSource("ph-provinces")) map.removeSource("ph-provinces");
    map.addSource("ph-provinces", {
      type: "geojson",
      data,
      // generateId → stable ids for feature-state hover highlighting.
      generateId: true,
      tolerance: 0,
      buffer: 32,
    });
    // Flat, saturated region fills like a printed colored map — nearly opaque
    // so the banding reads clearly even zoomed all the way out.
    map.addLayer(
      {
        id: "ph-provinces-fill",
        type: "fill",
        source: "ph-provinces",
        paint: {
          "fill-color": ["coalesce", ["get", "color"], "#e8e1cd"],
          "fill-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            0.92,
            6,
            0.85,
            10,
            0.7,
            12,
            0.3,
            13.5,
            0,
          ],
        },
      },
    );
    // Hover highlight (white veil) driven by feature-state.
    map.addLayer(
      {
        id: "ph-provinces-hover",
        type: "fill",
        source: "ph-provinces",
        paint: {
          "fill-color": "#ffffff",
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.3,
            0,
          ],
        },
      },
    );
    // Subtle province outlines — thin parchment-tone borders like a printed
    // atlas (no hard white separators over the uniform terrain tones).
    map.addLayer(
      {
        id: "ph-provinces-outline",
        type: "line",
        source: "ph-provinces",
        layout: { visibility: "visible" },
        paint: {
          "line-color": "#7f806f",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            0.7,
            8,
            1.2,
            12,
            1.8,
          ],
          "line-opacity": 0.7,
        },
      },
    );
    // Province name labels — ONE label per province (centroid of its largest
    // polygon) so island chains like ARMM/MIMAROPA don't repeat the name on
    // every islet. Bold UPPERCASE with a heavy white halo like a printed map.
    map.addSource("ph-province-label-points", {
      type: "geojson",
      data: provinceLabelPoints(data),
    });
    map.addLayer(
      {
        id: "ph-provinces-labels",
        type: "symbol",
        source: "ph-province-label-points",
        minzoom: 4,
        maxzoom: 11,
        layout: {
          visibility: "visible",
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Bold"],
          "text-transform": "uppercase",
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            9,
            6,
            11,
            8,
            13,
            12,
            16,
          ],
          "text-letter-spacing": 0.08,
          "text-padding": 6,
        },
        paint: {
          "text-color": "#1b2733",
          "text-halo-color": "rgba(255, 255, 255, 0.98)",
          "text-halo-width": 2.8,
          "text-halo-blur": 0.4,
        },
      },
    );
  } catch {
    // Cosmetic only — never break the map because the provinces failed.
  }
}

const MAP_CSS = `
.maplibregl-popup-content{padding:0!important;border-radius:16px!important;overflow:hidden;border:1px solid rgba(226,232,240,.9);box-shadow:0 18px 44px rgba(15,23,42,.22),0 2px 8px rgba(15,23,42,.08)!important}
.maplibregl-popup-close-button{width:30px;height:30px;font-size:16px;color:#94a3b8;border-radius:0 16px 0 8px;transition:background .15s ease,color .15s ease}
.maplibregl-popup-close-button:hover{background:#f1f5f9;color:#475569}
.maplibregl-popup-anchor-bottom .maplibregl-popup-tip,.maplibregl-popup-anchor-bottom-left .maplibregl-popup-tip,.maplibregl-popup-anchor-bottom-right .maplibregl-popup-tip{border-top-color:#fff}
.maplibregl-popup-anchor-top .maplibregl-popup-tip,.maplibregl-popup-anchor-top-left .maplibregl-popup-tip,.maplibregl-popup-anchor-top-right .maplibregl-popup-tip{border-bottom-color:#fff}
.maplibregl-ctrl-group{border-radius:12px!important;overflow:hidden;border:1px solid rgba(226,232,240,.9)!important;box-shadow:0 6px 18px rgba(15,23,42,.16),0 1px 3px rgba(15,23,42,.08)!important;background:rgba(255,255,255,.96)!important;backdrop-filter:blur(6px)}
.maplibregl-ctrl-group button{transition:background .15s ease}
.maplibregl-ctrl-group button:hover{background:#f1f5f9!important}
.maplibregl-ctrl-group button+button{border-top:1px solid #e2e8f0!important}
.maplibregl-ctrl-attrib{border-radius:8px 0 0 0!important;background:rgba(255,255,255,.85)!important;font-size:10px!important}
.fbx-pin{cursor:pointer;filter:drop-shadow(0 3px 5px rgba(15,23,42,.4));transform-origin:50% 100%;transition:transform .18s cubic-bezier(.34,1.56,.64,1);animation:fbx-pin-drop .35s cubic-bezier(.34,1.56,.64,1) backwards}
.fbx-pin:hover{transform:scale(1.18)}
@keyframes fbx-pin-drop{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}
/* Dark pill tooltip shown when hovering a province. */
.fbx-prov-tip .maplibregl-popup-content{background:rgba(15,23,42,.94)!important;color:#fff;padding:5px 12px!important;border-radius:9999px!important;border:none!important;box-shadow:0 8px 22px rgba(15,23,42,.4)!important;font-size:12px;font-weight:600;letter-spacing:.02em;backdrop-filter:blur(4px)}
.fbx-prov-tip .maplibregl-popup-tip{display:none!important}
`;

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
    "display:flex;width:38px;height:38px;align-items:center;justify-content:center;" +
    "border-radius:9999px;background:#2563eb;border:3px solid #fff;" +
    "box-shadow:0 6px 18px rgba(37,99,235,.45);cursor:grab;" +
    "transition:transform .15s ease";
  el.innerHTML = PIN_SVG;
  return el;
}

/** Teardrop pin SVG (LOST rose / FOUND emerald) with a white ring. */
function teardropPinSvg(kind: "lost" | "found"): string {
  const color = kind === "lost" ? "#e11d48" : "#059669";
  return (
    `<svg width="30" height="38" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">` +
    `<path d="M15 37C15 37 27.5 21.8 27.5 13.5a12.5 12.5 0 1 0-25 0C2.5 21.8 15 37 15 37Z" fill="${color}" stroke="#fff" stroke-width="2.5"/>` +
    `<circle cx="15" cy="13.5" r="4.5" fill="#fff" fill-opacity=".95"/>` +
    `</svg>`
  );
}

/** DOM element for a LOST (red) / FOUND (green) teardrop pin marker. */
function dotPinElement(kind: "lost" | "found"): HTMLElement {
  const el = document.createElement("div");
  el.className = "fbx-pin";
  // Soft drop shadow keeps the pin readable over busy topographic tiles.
  el.style.filter = "drop-shadow(0 2px 3px rgba(15, 23, 42, 0.45))";
  el.innerHTML = teardropPinSvg(kind);
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
  const isLost = point.kind === "lost";
  const badge = isLost
    ? "background:#ffe4e6;color:#be123c"
    : "background:#d1fae5;color:#047857";
  const accent = isLost ? "#e11d48" : "#059669";
  const label = isLost ? "LOST" : "FOUND";

  return (
    `<div style="width:244px;font-family:inherit;border-top:4px solid ${accent}">` +
    `<div style="padding:13px 16px 15px;background:linear-gradient(180deg,${isLost ? "#fff5f6" : "#f2fbf7"},#ffffff)">` +
    `<span style="display:inline-flex;align-items:center;gap:4px;border-radius:9999px;padding:4px 10px;font-size:10px;font-weight:800;letter-spacing:.08em;box-shadow:inset 0 0 0 1px ${accent}22;${badge}">${isLost ? "🔴" : "🟢"} ${label}</span>` +
    `<p style="margin:11px 0 0;font-size:15px;line-height:1.4;font-weight:700;color:#0f172a">${escapeHtml(point.title)}</p>` +
    `<p style="margin:6px 0 0;font-size:12px;color:#475569">📍 ${escapeHtml(place)}</p>` +
    (when
      ? `<p style="margin:4px 0 0;font-size:11.5px;color:#94a3b8">🕐 ${isLost ? "Lost" : "Found"} ${escapeHtml(when)}</p>`
      : "") +
    `<a href="${escapeHtml(point.href)}" style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:13px;padding:10px 12px;border-radius:9999px;background:linear-gradient(180deg,#3b82f6,#2563eb);color:#fff;font-size:11.5px;font-weight:700;letter-spacing:.02em;text-decoration:none;box-shadow:0 4px 12px rgba(37,99,235,.35);transition:filter .15s ease" onmouseover="this.style.filter='brightness(1.08)'" onmouseout="this.style.filter='none'">View Report &rarr;</a>` +
    `</div></div>`
  );
}

export default function PhilippinesMapImpl(props: PhilippinesMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const pickMarkerRef = useRef<MlMarker | null>(null);
  const lastValidPickRef = useRef<[number, number] | null>(null);
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
  // Set once the realistic basemap fails and we've fallen back to raster OSM.
  const styleFallbackUsedRef = useRef(false);

  // Keep the latest onPick without re-creating the map on every render.
  onPickRef.current = props.mode === "pick" ? props.onPick : undefined;

  // --- Map lifecycle -------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      // Realistic topographic raster basemap (terrain relief baked in).
      // Falls back to OSM if the ArcGIS tile service is unavailable.
      style: REALISTIC_TOPO_STYLE,
      maxPitch: 0,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      // Pick mode starts at the archipelago overview but MUST allow zooming
      // in — the whole point of the picker is placing a precise pin. Only
      // the initial camera frames the whole country (see fitBounds on ready).
      maxZoom: MAX_ZOOM,
      // Keep the camera focused on the Philippines and nearby context; the
      // soft boundary mask makes the archipelago visually dominant.
      maxBounds: MAP_MAX_BOUNDS,
      center: [121.0, 12.2],
      zoom: 3.9,
      attributionControl: false,
      // Smoothness: no symbol cross-fade lag on every style data change, and
      // no re-fetch churn for tiles that haven't actually expired.
      fadeDuration: 0,
      refreshExpiredTiles: false,
      // Keep a large tile pool so revisiting a zoom/area is instant instead of
      // re-downloading raster tiles from the (slow) public tile servers.
      maxTileCacheSize: 800,
    });
    mapRef.current = map;
    // Debug handle (harmless in production): lets diagnostics inspect the map.
    (window as unknown as Record<string, unknown>).__fbMap = map;

    map.addControl(
      new maplibregl.NavigationControl({
        showZoom: true,
        showCompass: false,
        visualizePitch: false,
      }),
      "top-left",
    );
    map.addControl(new maplibregl.FullscreenControl(), "top-left");
    map.addControl(
      new maplibregl.ScaleControl({ unit: "metric" }),
      "bottom-left",
    );
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );

    // If the realistic ArcGIS basemap can't be fetched (offline dev, CDN
    // outage), transparently fall back to raster OSM once.
    map.on("error", (e) => {
      const message =
        e && typeof e === "object" && "error" in e
          ? String((e as { error?: { message?: string } }).error?.message ?? "")
          : "";
      if (!styleFallbackUsedRef.current && /failed to fetch|network|style/i.test(message)) {
        styleFallbackUsedRef.current = true;
        map.setStyle(RASTER_FALLBACK_STYLE);
      }
    });

    // Frame the whole Philippines as soon as the map is ready, then add the
    // soft outside-the-archipelago dimmer.
    const onReady = () => {
      setMapReady(true);
      const compact = window.matchMedia("(max-width: 639px)").matches;
      map.fitBounds(INITIAL_BOUNDS, {
        padding: compact ? 18 : 34,
        maxZoom: PHILIPPINES_OVERVIEW_MAX_ZOOM,
        duration: 0,
      });
      // Apply the instant offline fallback mask (hides Borneo/Sabah) first,
      // then upgrade to the detailed Philippine boundary when its GeoJSON is ready.
      addFallbackMask(map);
      void addPhilippinesMask(map);
      void addProvincesLayers(map);
    };
    if (map.isStyleLoaded()) onReady();
    else map.once("load", onReady);

    // If the style ever reloads (for example after the fallback), the mask is wiped —
    // re-apply it.
    map.on("styledata", () => {
      if (map.isStyleLoaded()) {
        if (!map.getLayer("ph-mask")) {
          void addPhilippinesMask(map);
        }
        if (!map.getLayer("ph-provinces-fill")) {
          void addProvincesLayers(map);
        }
      }
    });

    // --- Province inspection: hover tooltip + click-to-zoom (view mode) ---
    let hoveredProvinceId: string | number | null = null;
    const provinceTip = new MlPopup({
      closeButton: false,
      closeOnClick: false,
      offset: 14,
      className: "fbx-prov-tip",
    });
    map.on("mousemove", "ph-provinces-fill", (e) => {
      if (!e.features?.length) return;
      const feature = e.features[0];
      // Provinces are informational only (tooltip + highlight) — not
      // clickable, so the cursor stays the default arrow.
      if (hoveredProvinceId !== null && hoveredProvinceId !== feature.id) {
        map.setFeatureState(
          { source: "ph-provinces", id: hoveredProvinceId },
          { hover: false },
        );
      }
      hoveredProvinceId = feature.id ?? null;
      if (feature.id !== undefined) {
        map.setFeatureState(
          { source: "ph-provinces", id: feature.id },
          { hover: true },
        );
      }
      const name = String(
        feature.properties?.shapeName ??
          feature.properties?.name ??
          feature.properties?.NAME_1 ??
          "",
      );
      if (name) {
        provinceTip
          .setLngLat(e.lngLat)
          .setHTML(escapeHtml(name))
          .addTo(map);
      }
    });
    map.on("mouseleave", "ph-provinces-fill", () => {
      map.getCanvas().style.cursor = "";
      if (hoveredProvinceId !== null) {
        map.setFeatureState(
          { source: "ph-provinces", id: hoveredProvinceId },
          { hover: false },
        );
        hoveredProvinceId = null;
      }
      provinceTip.remove();
    });

    // Pick mode: click to drop / move the pin, but only on actual Philippine land.
    const onClick = async (e: maplibregl.MapMouseEvent) => {
      if (props.mode !== "pick") return;

      const lat = e.lngLat.lat;
      const lng = e.lngLat.lng;
      const valid = await isPhilippinesCoordinate(lat, lng);

      if (!valid) {
        setGeoError("Please select a location inside the Philippines");
        return;
      }

      onPickRef.current?.(lat, lng);
      lastValidPickRef.current = [lng, lat];
      const compact = window.matchMedia("(max-width: 639px)").matches;
      map.fitBounds(INITIAL_BOUNDS, {
        padding: compact ? 18 : 34,
        maxZoom: PHILIPPINES_OVERVIEW_MAX_ZOOM,
        duration: 800,
      });
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
      window.setTimeout(() => {
        resize();
        if (t === 600) {
          const compact = window.matchMedia("(max-width: 639px)").matches;
          map.fitBounds(INITIAL_BOUNDS, {
            padding: compact ? 18 : 34,
            maxZoom: PHILIPPINES_OVERVIEW_MAX_ZOOM,
            duration: 0,
          });
        }
      }, t),
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
      // anchor "bottom" places the pin's TIP exactly on the report coordinate.
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([
        point.lng,
        point.lat,
      ]);
      if (isMobile) {
        el.addEventListener("click", () => setSelected(point));
      } else {
        marker.setPopup(
          new maplibregl.Popup({ offset: 14 }).setHTML(pointPopupHtml(point)),
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
          "display:flex;min-width:28px;height:28px;padding:0 8px;" +
          "align-items:center;justify-content:center;border-radius:9999px;" +
          "background:linear-gradient(180deg,#334155,#1e293b);color:#fff;" +
          "font-size:11.5px;font-weight:700;letter-spacing:.01em;" +
          "border:2px solid #fff;box-shadow:0 3px 10px rgba(15,23,42,.45);" +
          "cursor:pointer;transition:transform .15s cubic-bezier(.34,1.56,.64,1)";
        el.setAttribute("aria-label", `${group.length} reports`);
        el.textContent = String(group.length);
        el.addEventListener("mouseenter", () => {
          el.style.transform = "scale(1.12)";
        });
        el.addEventListener("mouseleave", () => {
          el.style.transform = "scale(1)";
        });
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
      });
      // MapLibre v6 requires a lngLat before addTo() — without it the marker's
      // first _update() reads `.lng` of undefined and crashes the page.
      if (pickLat !== null && pickLng !== null) marker.setLngLat([pickLng, pickLat]);
      marker.addTo(map);

      marker.on("dragend", async () => {
        const lngLat = marker.getLngLat();
        const valid = await isPhilippinesCoordinate(lngLat.lat, lngLat.lng);

        if (!valid) {
          setGeoError("Please keep the pin inside the Philippines");
          const lastValid = lastValidPickRef.current;
          if (lastValid) {
            marker.setLngLat(lastValid);
          }
          return;
        }

        lastValidPickRef.current = [lngLat.lng, lngLat.lat];
        onPickRef.current?.(lngLat.lat, lngLat.lng);
      });
      pickMarkerRef.current = marker;
    }
    pickMarkerRef.current.setLngLat([pickLng, pickLat]);
    lastValidPickRef.current = [pickLng, pickLat];
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

  /** Whether a GPS/IP coordinate falls inside Philippine territory. */
  async function insidePh(lat: number, lng: number): Promise<boolean> {
    return isPhilippinesCoordinate(lat, lng);
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
      if (!(await insidePh(latitude, longitude))) {
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
      async (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        if (!(await insidePh(latitude, longitude))) {
          setGeoError("You appear to be outside the Philippines");
          return;
        }
        flyToLocation(latitude, longitude);
      },
      () => {
        setLocating(false);
        // GPS failed - fall back to an approximate IP-based location.
        void locateByIp();
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

  /** Return to the full-archipelago Philippines overview. */
  function resetToPhilippines() {
    const map = mapRef.current;
    if (!map) return;
    const compact = window.matchMedia("(max-width: 639px)").matches;
    map.fitBounds(INITIAL_BOUNDS, {
      padding: compact ? 18 : 34,
      maxZoom: PHILIPPINES_OVERVIEW_MAX_ZOOM,
      duration: 900,
    });
  }

    const mapArea = (
    <div className="relative z-0 isolate h-full w-full overflow-hidden">
      {/* Premium map chrome (popups, controls, pin animations). */}
      <style dangerouslySetInnerHTML={{ __html: MAP_CSS }} />
      {/* MapLibre canvas. */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Locate-me + reset-Philippines controls — bottom-right. */}
      <div className="absolute bottom-3 right-3 z-[500] flex flex-col gap-1">
        <button
          type="button"
          aria-label="Reset to Philippines view"
          title="Reset to Philippines view"
          onClick={resetToPhilippines}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-600 shadow-md transition-colors hover:bg-white hover:text-blue-600"
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V21h14V9.5" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Show my location"
          title="Show my location (GPS)"
          onClick={locateMe}
          disabled={locating}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-600 shadow-md transition-colors hover:bg-white hover:text-blue-600 ${
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
              width="16"
              height="16"
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
      </div>

      {/* Compact legend — bottom-left, above the scale bar. View mode only. */}
      {props.mode === "view" && (
        <div
          aria-label="Map legend"
          className="absolute bottom-9 left-2.5 z-[500] flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white/95 px-2.5 py-1.5 shadow-md sm:gap-3 sm:px-3 sm:py-2"
        >
          <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 sm:text-[11px]">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-1 ring-white"
            />
            Lost
          </span>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 sm:text-[11px]">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full bg-emerald-600 ring-1 ring-white"
            />
            Found
          </span>
        </div>
      )}

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
                  ? "bg-sunrise-100 text-sunrise-700"
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

  // View mode: search + filters sit ABOVE the map; only compact map controls
  // (zoom, fullscreen, My Location) overlay the map itself.
  if (props.mode === "view") {
    return (
      <div className="flex h-full w-full flex-col">
        {/* Search + filters, above the map. */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 pb-3 pt-4 shadow-sm">
          <form onSubmit={runSearch} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a city, province, or place..."
              aria-label="Search a city, province, or place in the Philippines"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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

          <div className="mb-2 mt-3 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              {points.length} {points.length === 1 ? "report" : "reports"} on the map
            </p>
            {filter !== "all" && (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
              >
                Show all
              </button>
            )}
          </div>

          {/* ALL / LOST / FOUND — horizontally scrollable on small screens. */}
          <div className="flex gap-2 overflow-x-auto pb-0.5">
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
                className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-bold tracking-wide transition-all ${
                  filter === value
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
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
