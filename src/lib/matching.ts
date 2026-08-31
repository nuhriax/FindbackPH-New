import { differenceInCalendarDays, isValid } from "date-fns";

import { bestHashDistance, photoScoreFromDistance, type PhotoHash } from "@/lib/phash";

/* ============================================================================
   FindBack PH — deterministic matching engine (Phase 6)

   Design rules:
   - 100% deterministic. Same inputs always produce the same score.
   - No AI, no randomness, no invented data.
   - Only fields that actually exist in the schema are used:
     title, category, description, distinguishing_features, date, city,
     province, approximate_location.
   - There are no dedicated color / brand columns, so colors and brands are
     detected with fixed keyword lists over the free-text fields. If neither
     side mentions a color (or brand), that factor is EXCLUDED and its weight
     is redistributed proportionally — never counted as a mismatch.
   - Security: this module never receives reporter identity, contact info,
     reward amounts, or holding details. It only compares public report data
     and emits generic, non-sensitive explanation labels.
   ============================================================================ */

/* ============================================================================
   Weights (sum to 100)
   ============================================================================ */

export const MATCH_WEIGHTS = {
  category: 18,
  location: 26,
  date: 12,
  color: 9,
  brand: 12,
  description: 11,
  photo: 12,
} as const;

export const MATCH_THRESHOLDS = {
  possible: 40,
  likely: 55,
  strong: 75,
} as const;

export type MatchStrength = "possible" | "likely" | "strong";

export type MatchFactorKey = keyof typeof MATCH_WEIGHTS;

export type MatchFactor = {
  key: MatchFactorKey;
  /** Human-readable label, e.g. "Location nearby" when the factor succeeded. */
  label: string;
  /** Short detail, e.g. "Both reported Quezon City". */
  detail: string;
  /** Points earned for this factor (0 .. weight). */
  earned: number;
  /** Maximum points this factor could earn. */
  weight: number;
  /** Whether both sides actually had data for this factor. */
  applicable: boolean;
};

export type MatchResult = {
  /** 0–100, actually computed — never padded or randomized. */
  score: number;
  strength: MatchStrength;
  factors: MatchFactor[];
  /** Generic signals for UI chips (most significant first). */
  signals: string[];
};

/* ============================================================================
   Input — the minimal public shape both lost_items and found_items expose
   ============================================================================ */

export type MatchableItem = {
  id: string;
  title: string;
  category: string;
  city: string | null;
  province: string | null;
  approximate_location: string | null;
  /** date_lost or date_found, YYYY-MM-DD. */
  date: string | null;
  description: string | null;
  distinguishing_features: string | null;
  /**
   * Perceptual hashes of the report's photos (from item_images.phash).
   * Optional — when either side has no hashes the photo factor is excluded
   * from scoring entirely (never counted as a mismatch).
   */
  photoHashes?: PhotoHash[] | null;
};

/* ============================================================================
   Text normalization
   ============================================================================ */

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "this", "that", "have", "has", "was",
  "were", "lost", "found", "item", "thing", "near", "along", "area", "around",
  "somewhere", "sometime", "maybe", "possibly", "report", "reported",
]);

function normalizeText(value: string | null): string {
  return (
    value
      ?.toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim() ?? ""
  );
}

function words(value: string | null): Set<string> {
  const normalized = normalizeText(value);
  if (!normalized) return new Set();
  return new Set(
    normalized
      .split(/\s+/)
      .filter((word) => word.length >= 3 && !STOP_WORDS.has(word)),
  );
}

/** Overlap normalized by the larger set (0..1). */
function wordOverlap(a: string | null, b: string | null): number {
  const left = words(a);
  const right = words(b);
  if (!left.size || !right.size) return 0;
  let matches = 0;
  for (const word of left) {
    if (right.has(word)) matches += 1;
  }
  return matches / Math.max(left.size, right.size);
}

function locationEquals(a: string | null, b: string | null): boolean {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

/* ============================================================================
   Color detection — fixed dictionary, deterministic
   ============================================================================ */

const COLOR_WORDS: Record<string, string> = {
  black: "black",
  white: "white",
  red: "red",
  blue: "blue",
  navy: "navy",
  green: "green",
  yellow: "yellow",
  orange: "orange",
  purple: "purple",
  violet: "violet",
  pink: "pink",
  brown: "brown",
  gray: "gray",
  grey: "gray",
  silver: "silver",
  gold: "gold",
  beige: "beige",
  maroon: "maroon",
  teal: "teal",
};

function detectColors(item: MatchableItem): Set<string> {
  const text = `${item.title} ${item.description ?? ""} ${
    item.distinguishing_features ?? ""
  }`;
  const detected = new Set<string>();
  for (const word of words(text)) {
    const color = COLOR_WORDS[word];
    if (color) detected.add(color);
  }
  return detected;
}

/* ============================================================================
   Brand / model detection — fixed dictionary, deterministic
   ============================================================================ */

const BRAND_WORDS: Record<string, string> = {
  iphone: "apple", apple: "apple", airpods: "apple", macbook: "apple", ipad: "apple",
  samsung: "samsung", galaxy: "samsung",
  xiaomi: "xiaomi", redmi: "xiaomi", poco: "xiaomi",
  oppo: "oppo", vivo: "vivo", realme: "realme",
  huawei: "huawei", honor: "huawei",
  infinix: "infinix", tecno: "tecno", nokia: "nokia",
  sony: "sony", playstation: "sony", bravia: "sony",
  jbl: "jbl", bose: "bose", anker: "anker",
  asus: "asus", rog: "asus", acer: "acer",
  lenovo: "lenovo", thinkpad: "lenovo", dell: "dell", hp: "hp",
  canon: "canon", nikon: "nikon", gopro: "gopro",
  nike: "nike", jordan: "nike", adidas: "adidas",
  skechers: "skechers", crocs: "crocs", newbalance: "newbalance",
  samsonite: "samsonite", herschel: "herschel", northface: "northface",
  uniqlo: "uniqlo", gucci: "gucci", coach: "coach", longchamp: "longchamp",
  seiko: "seiko", casio: "casio", rolex: "rolex", swatch: "swatch",
  bpi: "bpi", bdo: "bdo", gcash: "gcash", landbank: "landbank",
};

function detectBrands(item: MatchableItem): Set<string> {
  const text = `${item.title} ${item.description ?? ""} ${
    item.distinguishing_features ?? ""
  }`;
  const detected = new Set<string>();
  for (const word of words(text)) {
    const brand = BRAND_WORDS[word];
    if (brand) detected.add(brand);
  }
  return detected;
}

/* ============================================================================
   Date parsing
   ============================================================================ */

function parseDateOnly(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return isValid(date) ? date : null;
}

/* ============================================================================
   Individual factor scorers — each returns { earned, detail } or null when
   the factor is NOT applicable (data missing on either side).
   ============================================================================ */

type FactorScore = { earned: number; detail: string };

function scoreCategory(a: MatchableItem, b: MatchableItem): FactorScore | null {
  if (!a.category || !b.category) return null;
  if (a.category !== b.category) {
    return { earned: 0, detail: "Different categories" };
  }
  return { earned: MATCH_WEIGHTS.category, detail: "Same category" };
}

function scoreLocation(a: MatchableItem, b: MatchableItem): FactorScore | null {
  const hasAnyLocation =
    Boolean(a.city || a.province || a.approximate_location) &&
    Boolean(b.city || b.province || b.approximate_location);
  if (!hasAnyLocation) return null;

  const sameCity = locationEquals(a.city, b.city);
  const sameProvince = locationEquals(a.province, b.province);
  const areaOverlap =
    wordOverlap(a.approximate_location, b.approximate_location) >= 0.4 ||
    locationEquals(a.approximate_location, b.approximate_location);

  let earned = 0;
  const parts: string[] = [];

  if (sameCity) {
    earned += 18;
    parts.push("same city");
  }
  if (sameProvince) {
    earned += 7;
    if (!sameCity) parts.push("same province");
  }
  if (areaOverlap) {
    earned += 5;
    parts.push("similar spot details");
  }

  earned = Math.min(earned, MATCH_WEIGHTS.location);
  const detail = parts.length
    ? `Location: ${parts.join(", ")}`
    : "Different locations";

  return { earned, detail };
}

function scoreDate(a: MatchableItem, b: MatchableItem): FactorScore | null {
  const dateA = parseDateOnly(a.date);
  const dateB = parseDateOnly(b.date);
  if (!dateA || !dateB) return null;

  const days = Math.abs(differenceInCalendarDays(dateA, dateB));
  const { date } = MATCH_WEIGHTS;

  let earned = 0;
  if (days <= 1) earned = date;
  else if (days <= 3) earned = date * 0.8;
  else if (days <= 7) earned = date * 0.6;
  else if (days <= 14) earned = date * 0.4;
  else if (days <= 30) earned = date * 0.2;

  const detail =
    days === 0
      ? "Same date"
      : `Dates ${days} day${days === 1 ? "" : "s"} apart`;

  return { earned, detail };
}

function scoreColor(a: MatchableItem, b: MatchableItem): FactorScore | null {
  const colorsA = detectColors(a);
  const colorsB = detectColors(b);
  // Not applicable unless BOTH reports mention at least one color.
  if (!colorsA.size || !colorsB.size) return null;

  for (const color of colorsA) {
    if (colorsB.has(color)) {
      return {
        earned: MATCH_WEIGHTS.color,
        detail: `Both mention ${color}`,
      };
    }
  }
  return { earned: 0, detail: "Different colors mentioned" };
}

function scoreBrand(a: MatchableItem, b: MatchableItem): FactorScore | null {
  const brandsA = detectBrands(a);
  const brandsB = detectBrands(b);
  if (!brandsA.size || !brandsB.size) return null;

  for (const brand of brandsA) {
    if (brandsB.has(brand)) {
      return {
        earned: MATCH_WEIGHTS.brand,
        detail: `Both mention ${brand}`,
      };
    }
  }
  return { earned: 0, detail: "Different brands mentioned" };
}

function scoreDescription(
  a: MatchableItem,
  b: MatchableItem,
): FactorScore | null {
  const textA = `${a.title} ${a.description ?? ""} ${
    a.distinguishing_features ?? ""
  }`;
  const textB = `${b.title} ${b.description ?? ""} ${
    b.distinguishing_features ?? ""
  }`;
  if (!normalizeText(textA) || !normalizeText(textB)) return null;

  const overlap = wordOverlap(textA, textB);
  const { description } = MATCH_WEIGHTS;

  let earned = 0;
  if (overlap >= 0.4) earned = description;
  else if (overlap >= 0.25) earned = description * 0.7;
  else if (overlap >= 0.15) earned = description * 0.4;

  const detail =
    earned >= description
      ? "Very similar wording"
      : earned > 0
        ? "Some shared details"
        : "Descriptions differ";

  return { earned, detail };
}

/* ============================================================================
   Strength + labels
   ============================================================================ */

export function getMatchStrength(score: number): MatchStrength | null {
  if (score >= MATCH_THRESHOLDS.strong) return "strong";
  if (score >= MATCH_THRESHOLDS.likely) return "likely";
  if (score >= MATCH_THRESHOLDS.possible) return "possible";
  return null;
}

const FACTOR_SCORERS: Record<
  MatchFactorKey,
  (a: MatchableItem, b: MatchableItem) => FactorScore | null
> = {
  category: scoreCategory,
  location: scoreLocation,
  date: scoreDate,
  color: scoreColor,
  brand: scoreBrand,
  description: scoreDescription,
  photo: scorePhoto,
};

const FACTOR_SUCCESS_LABELS: Record<MatchFactorKey, string> = {
  category: "Category matched",
  location: "Location nearby",
  date: "Date similar",
  color: "Color matched",
  brand: "Brand/model matched",
  description: "Description similar",
  photo: "Photos look alike",
};

/* ============================================================================
   Photo similarity (pHash)
   ============================================================================ */

function scorePhoto(a: MatchableItem, b: MatchableItem): FactorScore | null {
  const weight = MATCH_WEIGHTS.photo;
  const distance = bestHashDistance(a.photoHashes, b.photoHashes);
  const result = photoScoreFromDistance(distance, weight);
  if (!result) return null; // No comparable hashes on both sides — excluded.
  return result;
}

/* ============================================================================
   Main entry point
   ============================================================================ */

/**
 * Compares two reports and returns a deterministic, explainable match — or
 * null when the pair does not reach the "possible" threshold.
 */
export function calculateMatch(
  a: MatchableItem,
  b: MatchableItem,
): MatchResult | null {
  const factors: MatchFactor[] = [];

  for (const key of Object.keys(MATCH_WEIGHTS) as MatchFactorKey[]) {
    const weight = MATCH_WEIGHTS[key];
    const result = FACTOR_SCORERS[key](a, b);

    if (!result) {
      // Data missing on at least one side — factor excluded; its weight is
      // effectively redistributed by the normalization below.
      factors.push({
        key,
        label: key,
        detail: "Not enough information",
        earned: 0,
        weight,
        applicable: false,
      });
      continue;
    }

    const succeeded = result.earned >= weight * 0.5;

    factors.push({
      key,
      label: succeeded ? FACTOR_SUCCESS_LABELS[key] : key,
      detail: result.detail,
      earned: result.earned,
      weight,
      applicable: true,
    });
  }

  const applicable = factors.filter((f) => f.applicable);
  const possiblePoints = applicable.reduce((sum, f) => sum + f.weight, 0);
  const earnedPoints = applicable.reduce((sum, f) => sum + f.earned, 0);

  if (possiblePoints === 0) return null;

  // Normalize over applicable factors only — missing data never counts as a
  // mismatch, and scores always land on the same 0–100 scale.
  const score = Math.min(
    100,
    Math.round((earnedPoints / possiblePoints) * 100),
  );
  const strength = getMatchStrength(score);

  if (!strength) return null;

  const signals = applicable
    .filter((f) => f.earned >= f.weight * 0.5)
    .sort((x, y) => y.earned / y.weight - x.earned / x.weight)
    .map((f) => f.label);

  return { score, strength, factors, signals };
}




