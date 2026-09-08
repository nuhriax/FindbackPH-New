"use client";

// ---------------------------------------------------------------------------
// StepLocation — the report wizard's Step 2.
//
// Enhanced with geolocation button, better visual hierarchy, and improved
// map picker UX.
// ---------------------------------------------------------------------------

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Navigation, Crosshair, Trash2 } from "lucide-react";
import { PH_PROVINCES, PH_CITIES_BY_PROVINCE } from "@/lib/ph-addresses";
import type { WizardConfig } from "../report-wizard-config";
import { WizardStepShell } from "./wizard-step-shell";

const PhilippinesMap = dynamic(
  () =>
    import("@/components/map/philippines-map").then((m) => ({
      default: m.PhilippinesMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="skeleton h-64 w-full rounded-2xl" aria-hidden="true" />
    ),
  },
);

export function StepLocation({
  cfg,
  isActive,
  provinceVal,
  setProvinceVal,
  cityVal,
  setCityVal,
  pin,
  setPin,
  rewardChip,
  setRewardChip,
}: {
  cfg: WizardConfig;
  isActive: boolean;
  provinceVal: string;
  setProvinceVal: (v: string) => void;
  cityVal: string;
  setCityVal: (v: string) => void;
  pin: { lat: number; lng: number } | null;
  setPin: (p: { lat: number; lng: number } | null) => void;
  rewardChip: number | null;
  setRewardChip: (n: number | null) => void;
}) {
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const handleUseMyLocation = () => {
    setLocating(true);
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocError(err.message || "Unable to retrieve your location");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <WizardStepShell
      stepNumber={2}
      totalSteps={4}
      icon={MapPin as any}
      heading={cfg.stepHeadings[1]}
      support={cfg.stepSupport[1]}
      accent={cfg.accent}
      isActive={isActive}
    >
      <WhenSection
        cfg={cfg}
        rewardChip={rewardChip}
        setRewardChip={setRewardChip}
      />

      <WhereSection
        cfg={cfg}
        provinceVal={provinceVal}
        setProvinceVal={setProvinceVal}
        cityVal={cityVal}
        setCityVal={setCityVal}
        pin={pin}
        setPin={setPin}
        onUseMyLocation={handleUseMyLocation}
        locating={locating}
        locError={locError}
      />
    </WizardStepShell>
  );
}

function WhenSection({
  cfg,
  rewardChip,
  setRewardChip,
}: {
  cfg: WizardConfig;
  rewardChip: number | null;
  setRewardChip: (n: number | null) => void;
}) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <section className="report-subcard space-y-5 rounded-2xl border border-slate-200/70 bg-white/70 p-4 sm:p-5">
      <header>
        <p className="report-eyebrow text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          When did it happen?
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={cfg.dateName} className="label flex items-center gap-1.5">
            {cfg.dateLabel}
          </label>
          <div className="relative">
            <input
              id={cfg.dateName}
              name={cfg.dateName}
              type="date"
              required
              max={today}
              className="input pr-20 transition-all duration-200 focus:ring-4 focus:ring-teal-500/10"
            />
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById(cfg.dateName) as HTMLInputElement | null;
                if (input) {
                  input.value = today;
                  input.dispatchEvent(new Event("input", { bubbles: true }));
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-teal-50 px-2 py-1 text-[10px] font-semibold text-teal-700 transition-colors hover:bg-teal-100"
            >
              Today
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">{cfg.dateHelper}</p>
          <label className="mt-2 flex items-start gap-2 text-xs text-slate-600">
            <input type="checkbox" name="dateIsApproximate" value="true" className="mt-0.5 rounded border-slate-300 text-teal-600" />
            <span>This is my best estimate, not the exact date.</span>
          </label>
        </div>

        <div>
          <label htmlFor="timeWindow" className="label flex items-center gap-1.5">
            Approximate time <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="timeWindow"
            name="timeWindow"
            maxLength={100}
            placeholder="e.g. Around 6–7 PM"
            className="input transition-all duration-200 focus:ring-4 focus:ring-teal-500/10"
          />
          <p className="mt-1.5 text-xs text-slate-500">A time window can make nearby matches much easier to verify.</p>
        </div>

        {cfg.extraField === "reward" ? (
          <RewardField
            presets={cfg.rewardPresets ?? []}
            rewardChip={rewardChip}
            setRewardChip={setRewardChip}
          />
        ) : (
          <HoldingField />
        )}
      </div>
    </section>
  );
}

function RewardField({
  presets,
  rewardChip,
  setRewardChip,
}: {
  presets: readonly number[];
  rewardChip: number | null;
  setRewardChip: (n: number | null) => void;
}) {
  return (
    <div>
      <label htmlFor="rewardAmount" className="label flex items-center gap-1.5">
        Reward offered <span className="font-normal text-slate-500">(optional)</span>
      </label>
      <input type="hidden" name="rewardAmount" value={rewardChip ?? ""} />
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((amount) => {
          const active = rewardChip === amount;
          return (
            <button
              key={amount}
              type="button"
              onClick={() => setRewardChip(active ? null : amount)}
              className={[
                "rounded-full border px-3 py-2 text-sm font-semibold transition-all duration-200",
                "hover:scale-105 active:scale-95",
                active
                  ? "report-reward-chip-active border-teal-300 bg-teal-50 text-teal-800 shadow-md scale-105"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
              ].join(" ")}
            >
              ₱{amount.toLocaleString("en-PH")}
            </button>
          );
        })}
        <span className="text-xs text-slate-400 font-medium">or</span>
        <input
          id="rewardAmount"
          type="number"
          min={0}
          placeholder="Custom"
          value={rewardChip ?? ""}
          onChange={(e) =>
            setRewardChip(e.target.value ? Number(e.target.value) : null)
          }
          className="input max-w-[120px] transition-all duration-200 focus:ring-4 focus:ring-teal-500/10"
        />
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        Offering a reward is optional — a report never needs one to be found.
      </p>
    </div>
  );
}

function HoldingField() {
  const [custody, setCustody] = useState("with_me");
  return (
    <div className="sm:col-span-2">
      <label htmlFor="currentHoldingInfo" className="label flex items-center gap-1.5">
        Where it&apos;s currently being kept{" "}
        <span className="font-normal text-slate-500">(optional)</span>
      </label>
      <select
        id="custody"
        name="custody"
        value={custody}
        onChange={(e) => setCustody(e.target.value)}
        className="select mb-3 transition-all duration-200 focus:ring-4 focus:ring-emerald-500/10"
      >
        <option value="with_me">I’m keeping it safely</option>
        <option value="official">It was handed to an official lost-and-found</option>
        <option value="public_meetup">I can arrange a public handover</option>
      </select>
      <input
        id="currentHoldingInfo"
        name="currentHoldingInfo"
        placeholder={custody === "official" ? "e.g. SM North security desk" : "e.g. Available weekdays at the barangay hall"}
        className="input transition-all duration-200 focus:ring-4 focus:ring-teal-500/10"
      />
      <p className="mt-1.5 text-xs text-slate-500">Do not include a home address, phone number, or a precise meeting place here.</p>
    </div>
  );
}

function WhereSection({
  cfg,
  provinceVal,
  setProvinceVal,
  cityVal,
  setCityVal,
  pin,
  setPin,
  onUseMyLocation,
  locating,
  locError,
}: {
  cfg: WizardConfig;
  provinceVal: string;
  setProvinceVal: (v: string) => void;
  cityVal: string;
  setCityVal: (v: string) => void;
  pin: { lat: number; lng: number } | null;
  setPin: (p: { lat: number; lng: number } | null) => void;
  onUseMyLocation: () => void;
  locating: boolean;
  locError: string | null;
}) {
  return (
    <section className="report-subcard space-y-5 rounded-2xl border border-slate-200/70 bg-white/70 p-4 sm:p-5">
      <header>
        <p className="report-eyebrow text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {cfg.locationLabel}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Pick the closest province + city so people nearby can find your report.
        </p>
      </header>

      {/* Province/City grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="province" className="label flex items-center gap-1.5">
            Province <span className="font-normal text-slate-400">*</span>
          </label>
          <select
            id="province"
            name="province"
            required
            className="select transition-all duration-200 focus:ring-4 focus:ring-teal-500/10"
            value={provinceVal}
            onChange={(e) => {
              setProvinceVal(e.target.value);
              setCityVal("");
            }}
          >
            <option value="" disabled>
              Select province
            </option>
            {PH_PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
            {provinceVal && !PH_PROVINCES.includes(provinceVal) && (
              <option value={provinceVal}>{provinceVal}</option>
            )}
          </select>
        </div>
        <div>
          <label htmlFor="city" className="label flex items-center gap-1.5">
            City / Municipality <span className="font-normal text-slate-400">*</span>
          </label>
          <select
            id="city"
            name="city"
            required
            className="select transition-all duration-200 focus:ring-4 focus:ring-teal-500/10"
            value={cityVal}
            disabled={!provinceVal}
            onChange={(e) => setCityVal(e.target.value)}
          >
            <option value="" disabled>
              {provinceVal ? "Select city / municipality" : "Choose a province first"}
            </option>
            {(provinceVal ? PH_CITIES_BY_PROVINCE[provinceVal] ?? [] : []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            {cityVal &&
              !(provinceVal
                ? PH_CITIES_BY_PROVINCE[provinceVal] ?? []
                : []
              ).includes(cityVal) && <option value={cityVal}>{cityVal}</option>}
          </select>
        </div>
      </div>

      {/* Approximate location */}
      <div>
        <label htmlFor="approximateLocation" className="label flex items-center gap-1.5">
          Approximate location <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <input
          id="approximateLocation"
          name="approximateLocation"
          placeholder="e.g. Near SM North EDSA"
          className="input transition-all duration-200 focus:ring-4 focus:ring-teal-500/10"
        />
        <p className="mt-1.5 text-xs text-slate-500">{cfg.approxHelper}</p>
      </div>

      {/* Map pin picker */}
      <MapPinPicker
        pin={pin}
        setPin={setPin}
        onUseMyLocation={onUseMyLocation}
        locating={locating}
        locError={locError}
      />
    </section>
  );
}

function MapPinPicker({
  pin,
  setPin,
  onUseMyLocation,
  locating,
  locError,
}: {
  pin: { lat: number; lng: number } | null;
  setPin: (p: { lat: number; lng: number } | null) => void;
  onUseMyLocation: () => void;
  locating: boolean;
  locError: string | null;
}) {
  const [showMap, setShowMap] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <label className="label flex items-center gap-1.5 mb-0">
          Private location pin <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMap((visible) => !visible)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 lg:hidden"
            aria-expanded={showMap}
          >
            {showMap ? "Hide map" : "Add map pin"}
          </button>
          <button
            type="button"
            onClick={onUseMyLocation}
            disabled={locating}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all duration-200 hover:scale-105 hover:shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {locating ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-600 border-t-transparent" />
                <span>Locating…</span>
              </>
            ) : (
              <>
                <Crosshair size={14} aria-hidden="true" />
                <span>Use my location</span>
              </>
            )}
          </button>
          {pin && (
            <button
              type="button"
              onClick={() => setPin(null)}
              className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-all duration-200 hover:scale-105 hover:shadow-sm active:scale-95"
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {locError && (
        <p className="mt-2 text-xs text-red-600 animate-in fade-in slide-in-from-top-2 duration-300">
          {locError}
        </p>
      )}

      <p className="mt-1 text-xs text-slate-500">
        Optional. Pins improve nearby matching; public maps only show an approximate area, never an address.
      </p>

      <div className={`relative mt-3 h-72 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:h-80 lg:block lg:h-[26rem] ${showMap ? "block" : "hidden"}`}>
        <PhilippinesMap
          mode="pick"
          latitude={pin?.lat ?? null}
          longitude={pin?.lng ?? null}
          onPick={(lat, lng) => setPin({ lat, lng })}
        />
      </div>

      <div className={`${showMap ? "flex" : "hidden lg:flex"} mt-3 items-center justify-between gap-3 text-xs`}>
        <p className="text-slate-500">
          {pin
            ? "Drag the pin or click the map to adjust."
            : "Click anywhere on the map to drop a pin."}
        </p>
        {pin && (
          <span className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200 animate-in fade-in slide-in-from-top-2 duration-300">
            <MapPin size={11} aria-hidden="true" />
            Location saved — your exact location is kept private.
          </span>
        )}
      </div>

      <input type="hidden" name="latitude" value={pin ? String(pin.lat) : ""} />
      <input type="hidden" name="longitude" value={pin ? String(pin.lng) : ""} />
    </div>
  );
}
