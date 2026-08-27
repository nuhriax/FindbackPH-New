"use client";

/**
 * Philippines-only Leaflet map used in two places:
 *
 *  - mode="pick"  → the report wizard's "Pin exact location" picker. Click the
 *    map (or drag the pin) to choose an approximate spot; the pin and the map
 *    are hard-clamped to the Philippine bounding box.
 *  - mode="view"  → the search page's map view: LOST (red) / FOUND (green)
 *    markers with a legend and small popups, like the map on the homepage of
 *    the design reference.
 *
 * Loaded via next/dynamic with ssr:false (see philippines-map.tsx) because
 * Leaflet needs `window`.
 */

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { PH_BOUNDS, PH_CENTER } from "@/lib/ph-locations";

export type MapPoint = {
  id: string;
  kind: "lost" | "found";
  lat: number;
  lng: number;
  title: string;
  city: string | null;
  province: string | null;
  href: string;
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

// Keyless OpenStreetMap raster tiles. (CARTO's basemaps started requiring an
// API key — they now serve transparent "API KEY REQUIRED" placeholder tiles.)
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Clamp a picked coordinate into the Philippine bounding box. */
function clampToPhilippines(lat: number, lng: number): [number, number] {
  const [[south, west], [north, east]] = PH_BOUNDS;
  return [
    Math.min(north, Math.max(south, lat)),
    Math.min(east, Math.max(west, lng)),
  ];
}

/** Circular pins rendered as pure HTML (no Leaflet image assets needed). */
function pinIcon(kind: "pick" | "lost" | "found"): L.DivIcon {
  if (kind === "pick") {
    return L.divIcon({
      className: "fb-map-pin",
      html: `<span style="display:flex;width:34px;height:34px;align-items:center;justify-content:center;border-radius:9999px;background:#2563eb;color:#fff;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.35)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -17],
    });
  }
  const color = kind === "lost" ? "#f43f5e" : "#10b981";
  return L.divIcon({
    className: "fb-map-pin",
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.4)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

/** Re-measure the map after it becomes visible (it can mount inside a hidden wizard step). */
function SizeRefresher() {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 150);
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", onResize);
    };
  }, [map]);
  return null;
}

/**
 * Scroll-to-zoom that doesn't hijack page scrolling.
 *
 * The mouse wheel zooms ONLY after the user clicks the map once (and stops
 * again when the cursor leaves). Without this, wheel-over-map would trap the
 * page scroll — the classic reason maps feel "frozen" on long pages.
 */
function ScrollWheelZoomActivator() {
  const map = useMap();
  useEffect(() => {
    map.scrollWheelZoom.disable();
    const container = map.getContainer();
    const enable = () => map.scrollWheelZoom.enable();
    const disable = () => map.scrollWheelZoom.disable();
    map.on("click", enable);
    container.addEventListener("mouseleave", disable);
    return () => {
      map.off("click", enable);
      container.removeEventListener("mouseleave", disable);
    };
  }, [map]);
  return null;
}

/** Report map clicks back to the pick-mode owner. */
function ClickPicker({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      const [lat, lng] = clampToPhilippines(e.latlng.lat, e.latlng.lng);
      onPick(lat, lng);
    },
  });
  return null;
}

function PickMap({
  latitude,
  longitude,
  onPick,
}: {
  latitude: number | null;
  longitude: number | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const icon = useMemo(() => pinIcon("pick"), []);
  const hasPin = latitude !== null && longitude !== null;

  return (
    <>
      <ClickPicker onPick={onPick} />
      <SizeRefresher />
      {hasPin && (
        <Marker
          position={[latitude, longitude]}
          icon={icon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target as L.Marker;
              const { lat, lng } = marker.getLatLng();
              const [clampedLat, clampedLng] = clampToPhilippines(lat, lng);
              onPick(clampedLat, clampedLng);
            },
          }}
        />
      )}
    </>
  );
}

function ViewMap({ points }: { points: MapPoint[] }) {
  const lostIcon = useMemo(() => pinIcon("lost"), []);
  const foundIcon = useMemo(() => pinIcon("found"), []);

  return (
    <>
      <SizeRefresher />
      {points.map((point) => (
        <Marker
          key={point.id}
          position={[point.lat, point.lng]}
          icon={point.kind === "lost" ? lostIcon : foundIcon}
        >
          <Popup>
            <div className="min-w-[160px] font-sans">
              <p className="text-sm font-semibold text-navy-900">
                {point.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {[point.city, point.province].filter(Boolean).join(", ") ||
                  "Philippines"}
              </p>
              <p className="mt-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    point.kind === "lost"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {point.kind === "lost" ? "Lost" : "Found"}
                </span>
              </p>
              <a
                href={point.href}
                className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View report →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default function PhilippinesMapImpl(props: PhilippinesMapProps) {
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={PH_CENTER}
        zoom={5}
        minZoom={4}
        maxZoom={18}
        maxBounds={PH_BOUNDS}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={false}
        className="h-full w-full"
        attributionControl
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <ScrollWheelZoomActivator />

        {props.mode === "pick" ? (
          <PickMap
            latitude={props.latitude}
            longitude={props.longitude}
            onPick={props.onPick}
          />
        ) : (
          <ViewMap points={props.points} />
        )}
      </MapContainer>

      {/* Legend sits top-RIGHT so it never covers Leaflet's zoom control
          (which lives in the map's top-left corner). */}
      {props.mode === "view" && (
        <div className="pointer-events-none absolute right-3 top-3 z-[500] flex items-center gap-3 rounded-full border border-slate-200 bg-white/95 px-3.5 py-1.5 shadow-sm">
          <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-slate-600">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full bg-rose-500"
            />
            LOST
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-slate-600">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full bg-emerald-500"
            />
            FOUND
          </span>
        </div>
      )}

      {/* Hint for the click-to-activate scroll zoom behaviour. */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-[10px] font-semibold tracking-wide text-slate-500 shadow-sm">
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
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
        CLICK MAP, THEN SCROLL TO ZOOM
      </div>
    </div>
  );
}

