/**
 * Phase 6 verification script for the deterministic matching engine.
 *
 * Run with:  npx tsx scripts/test-matching.ts
 *
 * Covers: strong match, weak match, no match, missing fields, duplicate
 * reports (determinism), color/brand detection, and score symmetry.
 */

import { calculateMatch, type MatchableItem } from "../src/lib/matching";

let failures = 0;

function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`  PASS  ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const lostBase: MatchableItem = {
  id: "lost-1",
  title: "Black iPhone 11 with cracked screen",
  category: "phones",
  city: "Quezon City",
  province: "Metro Manila",
  approximate_location: "Near SM North EDSA terminal",
  date: "2026-08-20",
  description:
    "Lost my black iPhone 11 near the jeepney terminal. Has a cracked screen protector and a red Spigen case.",
  distinguishing_features: "Small scratch on the back camera, red case",
};

const foundStrong: MatchableItem = {
  id: "found-1",
  title: "iPhone 11 black found near terminal",
  category: "phones",
  city: "Quezon City",
  province: "Metro Manila",
  approximate_location: "SM North EDSA jeepney terminal",
  date: "2026-08-20",
  description:
    "Found a black iPhone 11 at the jeepney terminal. Cracked screen, red case, small scratch on back camera.",
  distinguishing_features: "Red case, cracked screen",
};

const foundWeak: MatchableItem = {
  id: "found-2",
  title: "Phone found in mall",
  category: "phones",
  city: "Makati",
  province: "Metro Manila",
  approximate_location: null,
  date: "2026-09-05",
  description: "Someone left a phone at the food court.",
  distinguishing_features: null,
};

const foundNoMatch: MatchableItem = {
  id: "found-3",
  title: "Blue Nike backpack",
  category: "bags",
  city: "Cebu City",
  province: "Cebu",
  approximate_location: null,
  date: "2026-07-01",
  description: "Blue Nike backpack found on a bus.",
  distinguishing_features: null,
};

console.log("\n== Strong match ==");
{
  const r = calculateMatch(foundStrong, lostBase);
  check("returns a result", r !== null);
  check("score >= 75 (strong)", (r?.score ?? 0) >= 75, `score=${r?.score}`);
  check(
    "explainable signals present",
    (r?.signals.length ?? 0) >= 3,
    r?.signals.join(" | "),
  );
  check(
    "signals include Category matched / Location nearby / Brand-model matched",
    r!.signals.includes("Category matched") &&
      r!.signals.includes("Location nearby") &&
      r!.signals.includes("Brand/model matched"),
    r!.signals.join(" | "),
  );
  check("deterministic (same inputs → same score)", calculateMatch(foundStrong, lostBase)?.score === r?.score);
}

console.log("\n== Weak match ==");
{
  const r = calculateMatch(foundWeak, lostBase);
  if (r) {
    check("below strong threshold", r.score < 75, `score=${r.score}`);
    check("strength is possible or likely", r.strength === "possible" || r.strength === "likely", r.strength);
  } else {
    console.log("  INFO  weak pair falls below 'possible' threshold (null) — acceptable");
  }
}

console.log("\n== No match ==");
check(
  "different category/city/date/description returns null",
  calculateMatch(foundNoMatch, lostBase) === null,
);

console.log("\n== Missing fields (weight redistribution) ==");
{
  const sparseFound: MatchableItem = {
    id: "found-4",
    title: "Wallet",
    category: "wallets",
    city: null,
    province: null,
    approximate_location: null,
    date: null,
    description: null,
    distinguishing_features: null,
  };
  const sparseLost: MatchableItem = {
    ...lostBase,
    title: "Wallet",
    category: "wallets",
    city: null,
    province: null,
    approximate_location: null,
    date: null,
    description: null,
    distinguishing_features: null,
  };
  const r = calculateMatch(sparseFound, sparseLost);
  // Only category is applicable → 20/20 = 100 normalized.
  check("sparse pair scores only on category (100 normalized)", r?.score === 100, `score=${r?.score}`);
  check(
    "non-applicable factors are marked as such",
    r!.factors.filter((f) => !f.applicable).length === 4,
  );
}

console.log("\n== Color factor ==");
{
  const blackFound: MatchableItem = { ...foundWeak, id: "f5", description: "black phone", city: "Quezon City" };
  const whiteLost: MatchableItem = { ...lostBase, category: "phones", title: "white phone", description: "a white phone", distinguishing_features: null };
  const rMismatch = calculateMatch(blackFound, whiteLost);
  const colorFactor = rMismatch?.factors.find((f) => f.key === "color");
  check("color mismatch earns 0 when both sides mention colors", colorFactor?.earned === 0 && colorFactor.applicable);
  const noColorFound: MatchableItem = { ...blackFound, description: "a phone" };
  const rNa = calculateMatch(noColorFound, whiteLost);
  check(
    "color excluded (not applicable) when one side has no color",
    rNa!.factors.find((f) => f.key === "color")?.applicable === false,
  );
}

console.log("\n== Duplicate reports (determinism) ==");
{
  const a = calculateMatch(foundStrong, lostBase);
  const b = calculateMatch({ ...foundStrong }, { ...lostBase });
  check("identical duplicates produce identical scores", a?.score === b?.score);
  check("symmetric-ish: order swap keeps same factors earned", calculateMatch(lostBase, foundStrong)?.score === a?.score);
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
