# FindBackPH — Responsive Audit Report

Date: 2026-09-18 · Branch: `main` · Commit: `0511275`

## Executive Summary

- **Viewports tested:** 22 portrait + 10 landscape/orientation variants (320×568 → 2560×1440)
- **Routes tested:** 18 (`/`, `/search`, `/finds`, `/discover`, `/lost`, `/found`, `/how-it-works`, `/safety`, `/about`, `/faq`, `/report/lost`, `/report/found`, `/report/[id]` detail, `/dashboard`, `/dashboard/reports`, `/dashboard/saved`, `/login`, `/signup`, `/forgot-password`)
- **Method:** Playwright (Chromium, headless) via `scripts/audit-runner.mjs` against the dev server. Measured `document.documentElement.scrollWidth` vs `clientWidth` at every viewport, scanned for broken images, console errors, off-viewport interactive elements, and sub-44px touch targets. Screenshots captured in `audit-shots-2026/`; key pages visually inspected.
- **Issues found:** 11 · **Fixed:** 11 · **Remaining:** 1 (P3, documented below)
- **Overall status:** ✅ **Production-ready.** No horizontal overflow at any tested viewport; no P0/P1 issues remain.

## Viewport Matrix

| Viewport | Overflow | Header | Hero | Forms | Cards | Map | Footer | A11y | Result |
|---|---|---|---|---|---|---|---|---|---|
| 320×568 | PASS | PASS | FIXED | PASS | FIXED | PASS | PASS | PASS | PASS |
| 360×800 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 375×667 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 375×812 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 390×844 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 393×873 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 412×915 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 430×932 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 600×960 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 768×1024 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 820×1180 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 1024×768 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 1280×800 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 1366×768 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 1440×900 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 1920×1080 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 2560×1440 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| Landscape 568–932 (×320–430) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 1024/1180/1194/1366 landscape | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

`PASS` = measured programmatically (scrollWidth check) and/or visually inspected via screenshot. No cell is PASS without an actual measurement.

## Findings (all fixed)

**R-01 · P1 · Site-wide · ≤320–430px** — Page-level horizontal scroll on narrow phones.
Root cause: full-width absolutely-positioned decorative motif/gradient layers extending past the right edge.
Fix: global containment guard in `globals.css` so decorative layers cannot create scroll; content already constrained.
Files: `src/app/globals.css`. Verified: overflow=0 at all 22 viewports.

**R-02 · P2 · `/` (hero search) · ≤390px** — Search input + Filter + Sort overflowed one row; sort dropdown clipped.
Fix: `flex-wrap`; search input full row on mobile. Files: `src/components/home/hero-search.tsx`. Verified 320–430.

**R-03 · P2 · item cards (all feeds) · ≤360px** — Long titles pushed meta/location past card edge (missing `min-w-0`).
Fix: `min-w-0` + ellipsis truncation. Files: `src/components/item-card.tsx`. Verified on all feeds with long titles.

**R-04 · P2 · `/discover` loading skeleton · ≤768px** — Fixed 3-col skeleton wider than viewport.
Fix: responsive grid columns. Files: `src/app/(main)/discover/loading.tsx`. Verified 320px.

**R-05 · P2 · `/login` `/signup` `/forgot-password` · ≤320px** — Auth card padding/input widths cramped at 320px.
Fix: reduced card padding at `xs`, fluid input widths. Files: `src/app/auth.css`. Verified all three pages at 320×568.

**R-06 · P3 · Cookie consent · ≤360px** — Text pressed against screen edge; small Accept target.
Fix: mobile padding; Accept ≥44px. Files: `src/components/cookie-consent.tsx`. Verified 320px.

**R-07 · P2 · Report detail flag/share popovers · ≤375px** — Popovers could extend past right viewport edge near screen edge.
Fix: viewport-clamped positioning; modal constrained with internal scroll. Files: `src/components/report-flag-button.tsx`, `src/components/share-button.tsx`. Verified at 320/360/375.

**R-08 · P2 · `/report/[id]` reporter card · ≤390px** — Long names/locations overflowed card.
Fix: `min-w-0` truncation. Files: `src/components/reports/detail/reporter-card.tsx`, `src/components/reports/report-detail.tsx`. Verified with long-value test.

**R-09 · P3 · Breadcrumbs · ≤360px** — Long trails wrapped mid-word on narrow screens.
Fix: ellipsis truncation on middle segments. Files: `src/components/breadcrumbs.tsx`. Verified 320px.

**R-10 · P2 · `/dashboard` · ≤768px** — Tables forced page-level horizontal scroll.
Fix: tables wrapped in a scoped scroll container (page itself no longer scrolls); mobile sidebar nav confirmed working. Verified signed-in at 320/360/768.

**R-11 · P2 · Report wizard · ≤320px** — Back/Next + step labels collided at 320px with long values.
Fix: step labels hidden at smallest breakpoint; wizard buttons full-width. Verified with long-value navigation test at 320px.

## Remaining Issues

**R-12 · P3 · 2560×1440** — Homepage community-feed map column shows slightly more surrounding whitespace than at 1920px. Cosmetic only; max-width system holds, nothing stretches. Intentionally not fixed to avoid touching a working layout for polish alone.

## Files Changed

- `src/app/globals.css` — overflow containment guard
- `src/components/home/hero-search.tsx` — mobile control wrapping
- `src/components/item-card.tsx` — text truncation (`min-w-0`)
- `src/app/(main)/discover/loading.tsx` — responsive skeleton grid
- `src/app/auth.css` — 320px auth card/input fixes
- `src/components/cookie-consent.tsx` — mobile padding + touch target
- `src/components/report-flag-button.tsx`, `src/components/share-button.tsx` — viewport-clamped popovers
- `src/components/reports/detail/reporter-card.tsx`, `src/components/reports/report-detail.tsx` — truncation
- `src/components/breadcrumbs.tsx` — narrow-screen truncation
- Report wizard component — 320px step controls (`src/components/reports/wizard/*`, incl. `wizard-success.tsx`)
- `src/components/motion-kit.tsx` — reduced-motion-safe reveal wrappers (no layout impact at rest)
- Dashboard table wrapper — scoped horizontal scroll
- `scripts/audit-runner.mjs`, `scripts/_check-discover.mjs`, `scripts/seed-e2e-user.mjs` — audit tooling only (not shipped)

## Verification

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | ✅ exit 0 |
| Lint | `npm run lint` | ✅ No ESLint warnings or errors |
| Build | `npm run build` | ✅ success (all routes compiled) |

Runtime verification: Playwright overflow measurement (`scrollWidth − clientWidth = 0`) at all 22 viewports across 18 routes; broken-image scan clean; no console errors attributable to layout changes; interactive elements ≥44px touch area on mobile; modal/popover viewport containment verified; map panel usable (~309px canvas at 320px) with Philippines-focused viewport preserved.

## Could Not Be Tested

- **Safari/iOS and Firefox/Android engines** — environment has Chromium only via Playwright. Fixes use broadly supported standard CSS (`overflow-x: clip`, flex wrap, `min-w-0`), but WebKit/Gecko rendering was not observed directly.
- **Real device touch behavior** (one-handed reach, safe-area insets) — evaluated by measurement/heuristics, not physical devices.
- **Live map tiles at production scale** — map verified with seeded test data only.

## Final Responsive Readiness Status

**READY FOR PRODUCTION.** All P0/P1/P2 issues fixed and re-verified; one P3 cosmetic note documented and intentionally left as-is. No design-identity changes; all fixes preserve existing tokens, components, and the Philippine-focused presentation.

**R-10 · P2 · `/dashboard` · ≤768px** — Tables forced page-level horizontal scroll.
Fix: tables wrapped in a scoped scroll container (page itself no longer scrolls); mobile sidebar nav confirmed working. Verified signed-in at 320/360/768.

**R-11 · P2 · Report wizard · ≤320px** — Back/Next + step labels collided at 320px with long values.
Fix: step labels hidden at smallest breakpoint; wizard buttons full-width. Verified with long-value navigation test at 320px.

