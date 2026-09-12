"use client";

// ---------------------------------------------------------------------------
// ReportWizard config
// ---------------------------------------------------------------------------
// Single source of truth for per-kind copy, accents, steps, and review
// snapshot. Extracted from report-wizard.tsx so the wizard shell and each
// step subcomponent can stay small and read top-down.
//
// Any change here must keep the field names the server actions consume —
// these are the keys FormData picks up off the form.
// ---------------------------------------------------------------------------

import {
  PackageCheck,
  PackageSearch,
  type LucideIcon,
} from "lucide-react";
import {
  createFoundItemAction,
  createLostItemAction,
} from "@/lib/actions/items";

export type WizardKind = "lost" | "found";

export type AccentPalette = {
  text: string;
  ring: string;
  iconBg: string;
  chipActive: string;
  chipActiveTitle: string;
  chipActiveIcon: string;
  chipDone: string;
  pulse: string;
  stepCircle: string;
  hoverBorder: string;
  tip: string;
  tipIcon: string;
  edit: string;
};

export const ACCENT: Record<"lost" | "found", AccentPalette> = {
  // Lost flow — Coral (#E1573C ramp, aliased as "sunrise"). Coral is reserved
  // for lost-item states, warnings, and alerts; it signals "missing".
  lost: {
    text: "text-sunrise-600",
    ring: "ring-sunrise-400/20",
    iconBg: "from-sunrise-500 to-sunrise-600 shadow-sunrise-500/25",
    chipActive: "bg-sunrise-50 border-sunrise-200",
    chipActiveTitle: "text-sunrise-900",
    chipActiveIcon: "bg-sunrise-600",
    chipDone: "bg-sunrise-100 text-sunrise-700",
    pulse: "bg-sunrise-500",
    stepCircle: "from-sunrise-400 to-sunrise-600",
    hoverBorder: "hover:border-sunrise-200",
    tip: "border-sunrise-200/70 bg-sunrise-50/70",
    tipIcon: "text-sunrise-600",
    edit: "text-sunrise-600 hover:bg-sunrise-50 hover:text-sunrise-700",
  },
  // Found flow — leaf green (#1B8956 ramp, aliased as "emerald"). Signals
  // "safe / good news" and stays visually distinct from the lost coral.
  found: {
    text: "text-emerald-600",
    ring: "ring-emerald-400/20",
    iconBg: "from-emerald-500 to-emerald-600 shadow-emerald-500/25",
    chipActive: "bg-emerald-50 border-emerald-200",
    chipActiveTitle: "text-emerald-900",
    chipActiveIcon: "bg-emerald-600",
    chipDone: "bg-emerald-100 text-emerald-700",
    pulse: "bg-emerald-500",
    stepCircle: "from-emerald-400 to-emerald-600",
    hoverBorder: "hover:border-emerald-200",
    tip: "border-emerald-200/70 bg-emerald-50/70",
    tipIcon: "text-emerald-600",
    edit: "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700",
  },
};

export type ReviewSnapshot = {
  title: string;
  category: string;
  color: string;
  description: string;
  date: string;
  city: string;
  province: string;
  approximateLocation: string;
  timeWindow: string;
  hasPrivateDetail: boolean;
  currentHoldingInfo?: string;
  pinned: string;
};

export type WizardConfig = {
  action: (formData: FormData) => Promise<{ error?: string; itemId?: string }>;
  itemType: "lost_item" | "found_item";
  formId: string;
  storageKey: string;
  accent: AccentPalette;
  eyebrowIcon: LucideIcon;
  eyebrowLabel: string;
  heroTitle: React.ReactNode;
  heroLead: string;
  captions: readonly string[];
  stepHeadings: readonly string[];
  stepSupport: readonly string[];
  distLabel: string;
  distPlaceholder: string;
  dateName: string;
  dateLabel: string;
  dateHelper: string;
  locationLabel: string;
  approxHelper: string;
  publishLabel: string;
  continueLabels: readonly string[];
  extraField: "reward" | "holding";
  rewardPresets?: readonly number[];
  success: {
    title: string;
    lead: string;
    steps: readonly (readonly [string, string])[];
    basePath: string;
    tip: string;
    shareTitle: string;
    shareText: string;
  };
};

export const CONFIG: Record<WizardKind, WizardConfig> = {
  lost: {
    action: createLostItemAction,
    itemType: "lost_item",
    formId: "lost-report-form",
    storageKey: "fb-draft-lost",
    accent: ACCENT.lost,
    eyebrowIcon: PackageSearch,
    eyebrowLabel: "Lost something?",
    heroTitle: (
      <>
        Report a{" "}
        <span className="bg-gradient-to-r from-sunrise-600 to-sunrise-500 bg-clip-text text-transparent">
          lost item
        </span>
      </>
    ),
    heroLead:
      "Add as much detail as you can — it helps us find a match faster. Only share the item's details publicly; your personal info stays private.",
    captions: [
      "Step 1 · Item details",
      "Step 2 · When & where",
      "Step 3 · Photos",
      "Step 4 · Review & publish",
    ],
    stepHeadings: [
      "What did you lose?",
      "When & where did you last have it?",
      "Add photos if you have them",
      "Review before publishing",
    ],
    stepSupport: [
      "Tell people what your missing item looks like.",
      "Help people narrow down where the item may have been lost.",
      "A photo can help people recognize your item, but you can continue without one.",
      "Make sure everything looks right before your report goes live.",
    ],
    distLabel: "Private verification detail",
    distPlaceholder:
      "e.g. Small scratch beside the camera, blue wallpaper, sticker inside the case",
    dateName: "dateLost",
    dateLabel: "Last seen date",
    dateHelper: "If you don't know the exact time, that's okay.",
    locationLabel: "Last known location",
    approxHelper:
      "Avoid entering an exact home address or other sensitive location.",
    publishLabel: "Publish lost report",
    continueLabels: [
      "Continue to location",
      "Continue to photos",
      "Review report",
    ],
    extraField: "reward",
    rewardPresets: [100, 500, 1000, 2000, 5000],
    success: {
      title: "Your lost report is",
      lead: "Nice work — we've started matching it against found items right away. When something promising turns up, we'll notify you instantly.",
      steps: [
        ["We search", "We compare it with active found reports in your area."],
        ["We notify you", "A notification appears the moment a possible match is found."],
        ["You reunite", "Confirm ownership, arrange a safe handover, and mark it home."],
      ],
      basePath: "/lost",
      tip: "Tip: share your report link on social media — it doubles the chance of a match.",
      shareTitle: "Lost item report on FindbackPH",
      shareText: "Help me find this item — it was reported here:",
    },
  },

  found: {
    action: createFoundItemAction,
    itemType: "found_item",
    formId: "found-report-form",
    storageKey: "fb-draft-found",
    accent: ACCENT.found,
    eyebrowIcon: PackageCheck,
    eyebrowLabel: "Found something?",
    heroTitle: (
      <>
        Report a{" "}
        <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
          found item
        </span>
      </>
    ),
    heroLead:
      "Thank you for helping return this item to its owner. Every report brings something one step closer to home.",
    captions: [
      "Step 1 · Item details",
      "Step 2 · When & where",
      "Step 3 · Photos",
      "Step 4 · Review & publish",
    ],
    stepHeadings: [
      "What did you find?",
      "When & where did you find it?",
      "Help the owner recognize it",
      "Review before publishing",
    ],
    stepSupport: [
      "Describe the item so its owner can recognize it.",
      "Help the owner understand where the item was found.",
      "A clear photo makes it easier for the owner to recognize their item.",
      "Make sure everything looks right before your report goes live.",
    ],
    distLabel: "Private verification detail",
    distPlaceholder:
      "e.g. Small scratch beside the camera, blue wallpaper, sticker inside the case",
    dateName: "dateFound",
    dateLabel: "Date found",
    dateHelper: "If you don't remember the exact date, your best guess is fine.",
    locationLabel: "Found location",
    approxHelper:
      "Avoid entering an exact home address or other sensitive location.",
    publishLabel: "Publish found report",
    continueLabels: [
      "Continue to location",
      "Continue to photos",
      "Review report",
    ],
    extraField: "holding",
    success: {
      title: "Thank you — your found report is",
      lead: "You just made someone's day possible. When your report matches a lost report, we'll flag it and help you arrange a safe return.",
      steps: [
        ["It's visible", "Your report is now public to people searching the community."],
        ["We help it match", "If a lost report seems to match, we flag it as a possible match."],
        ["Safe return", "Confirm ownership details and arrange a safe, public handover."],
      ],
      basePath: "/found",
      tip: "Tip: share the report so the owner can find it — someone is looking for this right now.",
      shareTitle: "Found item report on FindbackPH",
      shareText: "Is this yours? It was found and reported here:",
    },
  },
};

export const TOTAL_STEPS = 4;
