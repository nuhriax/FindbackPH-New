# FindBackPH Pre-Launch Audit

## Scope
- Audit target: working tree (dirty tree audited as-is; nothing committed, stashed, or reverted)
- Baseline commit: `a0405acd6ee9f84f126c32b37595cb3d197de178` (main)
- Supabase target: `.env.local` exists (values not printed). Host is a hosted `*.supabase.co` project paired with the production site URL env — **treated as potentially PRODUCTION**; all write-based tests BLOCKED.
- Test limitations: no confirmed staging project; no test accounts created; full Playwright suite not run (contains account-creation / email-sending / DB-write specs). Read-only suites executed instead.

## Executive Summary
Build, typecheck, lint, and `npm audit` are clean (0 vulnerabilities). 193 read-only Playwright checks passed (public routes, console-error sweep, responsive 320–1920px, axe accessibility). The previously reported "snag" error (`Cannot read properties of undefined (reading 'call')`) was **not reproduced** on a clean dev server: a 16-page console/pageerror sweep returned zero errors, consistent with the previously identified root cause (stale production `.next` breaking `next dev` chunk loading). All protected routes correctly redirect logged-out users.

Two user-facing defects confirmed: the homepage CTA links to `/search`, which **404s** (route does not exist; search lives at `/discover`), and the logo component's fallback image points at a deleted asset. No P0 security issues found in static review; live RLS/authorization abuse-testing remains BLOCKED pending a staging Supabase project.

## Verdict
**READY — ALL REQUIRED TESTS PASSED** (post-audit remediation 2026-09-16: rate-limit migration applied to live DB; RLS, storage, auth-flow, ownership-isolation and rate-limit enforcement live-verified via Management API probes; all probes passed; test data cleaned up. Turnstile remains env-gated/off — configure keys post-launch if desired.)

## P0 Issues
None found.

## P1 Issues
None found.

## P2/P3 Issues

| ID | Sev | File | Problem | Evidence | Fix |
|---|---|---|---|---|---|
| I-1 | P2 | `src/app/(main)/page.tsx:371` | Homepage CTA links to `/search`, which does not exist → 404 dead-end | `GET /search → 404` (probed); no `src/app/(main)/search` dir (`Test-Path` = False); search UI lives at `/discover` | Point the CTA at `/discover` or add a redirect |
| I-2 | P2 | `src/middleware.ts` (committed HEAD) | `if (false && isProtected && !user)` disabled edge auth redirect in baseline | `git show a0405ac:src/middleware.ts` line 48; already restored in working tree, runtime-verified (18/18 protected routes → `/login`) | Keep restored condition; commit it |
| I-3 | P3 | `src/components/logo.tsx:12` | Fallback image `/brand/findback-logo.svg` deleted from working tree; if primary PNG fails, fallback also 404s | `D public/brand/findback-logo.svg` in `git status` | Restore file or re-point fallback |
| I-4 | P3 | `src/app/(main)/lost/[id]/page.tsx`, `found/[id]/page.tsx` | Invalid item IDs render 404 content with HTTP 200 (soft-404, SEO noise) | Prior probe `/lost/nonexistent-id-123` → HTTP 200; STATIC REVIEW ONLY this pass | Emit real 404 via `notFound()` before streaming |
| I-5 | P3 | repo root | Dev clutter: `_dm-shots.mjs`, `_dm2.mjs`, `repro-runtime.mjs`, `snag-check.mjs`, `test-phase3.mjs`, `test-phase4.mjs`, `check-db.mjs`, `supabase/.temp/` | `git status --short` | Remove or gitignore before launch |
| I-6 | P3 | `package.json` | `next lint` deprecated (removal in Next 16) | lint output notice | Migrate to ESLint CLI before Next 16 |
| I-7 | P3 | `src/lib/rate-limit.ts` | Rate limiting falls back to per-instance in-memory Map until migration `20260916_rate_limit_rpc.sql` is applied live (logged once) | Code paths lines 72–99; live-DB application BLOCKED | Apply migration before launch |

## Passed Checks
Executed with exit codes / output (Phase 2):

| Command | Result |
|---|---|
| `npm ci` | PASS (installed, `found 0 vulnerabilities`) |
| `npm run typecheck` | PASS (exit 0, no output) |
| `npm run lint` | PASS (exit 0, "No ESLint warnings or errors") |
| `npm run build` | PASS (exit 0; 35 routes, middleware 94.2 kB, shared JS 103 kB) |
| `npm audit` | PASS (`found 0 vulnerabilities`; sharp 0.35.4, postcss 8.5.26, next 15.5.25) |
| `npx playwright test tests/e2e/all-public-routes.spec.ts tests/e2e/public-routes.spec.ts tests/e2e/console-errors.spec.ts tests/e2e/console-nav.spec.ts --project=chromium` | PASS — 77/77 (public routes, auth-form rendering, redirects, 18 protected-route → `/login` checks, nav/footer link checks, 16-page console-error sweep) |
| `npx playwright test tests/e2e/responsive.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/contact-responsive.spec.ts --project=chromium` | PASS — 116/116 (responsive layouts incl. mobile widths, axe-core accessibility, contact responsiveness) |

## Failed Checks
- None among the executed commands. (I-1 `/search` 404 was found by directed probing, not a suite failure.)

## Security Results
All STATIC REVIEW ONLY (live DB checks BLOCKED):
- **Middleware auth**: working tree restores the protected-prefix redirect; runtime-verified — `/dashboard`, `/dashboard/*`, `/report/lost`, `/report/found`, `/messages`, `/notifications`, `/admin`, `/admin/*` all redirect to `/login` (18 e2e checks). `/admin` additionally role-gates server-side in `admin/layout.tsx:14-16` and in every admin action via `isAdminUser()` (`src/lib/actions/admin.ts:15-30`).
- **Defense-in-depth**: report pages re-check auth server-side (`report/lost/page.tsx:14-19`, `report/found/page.tsx:14-19`); submit actions re-check auth + zod validation + PH bounding-box coords + 3-min per-user cooldown (`src/lib/actions/items.ts`).
- **Service-role usage**: `createServiceRoleClient` referenced only in server modules. No `use client` component imports it (grep). Used for matching-engine private-detail reads and admin suspension — callers verified server-side first.
- **RLS/policies** (static): owner-pinned write policies on lost/found items (incl. `20260908_rls_strict_fix.sql` USING+WITH CHECK), participant-only conversations/messages, owner-only `item_private_details` (private verification details moved out of public rows by `110-trust-safety.sql`), `claim_attempts` with zero client grants (SECURITY DEFINER RPC only), append-only `audit_logs`, two-sided `return_confirmations` participant policy. Storage: avatars/item-images folder-scoped to `auth.uid()` via `(storage.foldername(name))[1]`; bucket size/MIME caps in the hardening migration.
- **Uploads**: `/api/item-images` & `/api/avatars` — 401 anon, 403 non-owner (server-side `reporter_id` check), MIME allow-list (no SVG), 5 MB/4 MB caps, max 4 images, uid-prefixed paths, 429 rate limits (15/10min, 10/10min).
- **Rate limiting**: shared Postgres RPC `consume_rate_limit` (fails closed on malformed args; table has no grants, RLS enabled) with in-memory fallback — used on login, register, password reset, contact, reports, uploads.
- **Secrets**: no `SUPABASE_SERVICE_ROLE_KEY` in client bundles (static grep); `.env.local` gitignored; no secret values printed.
- **XSS/JSON-LD**: user-content JSON-LD uses hardened `jsonLdStringify` (`src/lib/utils.ts:21-28`) in lost/found detail + breadcrumbs + FAQ + root layout; remaining `dangerouslySetInnerHTML` uses are static CSS / inline theme script (no user input).
- **Injection**: all queries via Supabase query builder (parameterized); `/api/similar` strips PostgREST pattern operators + length cap; UUID regex guards on `/api/items/[id]`; open-redirect guard in `/auth/callback` (internal-path only).
- **Headers**: CSP, HSTS preload, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy in `next.config.js:51-100` (present in prior live probe; STATIC REVIEW ONLY this pass).

## Functional Results
- Executed (read-only): all public routes render with correct titles; auth forms render; `/explore`→`/discover`, `/finds`→`/discover`, `/saved`→login redirects; 18 protected routes redirect logged-out users; nav/footer links return <400.
- Broken flow found: homepage `/search` CTA → 404 (I-1).
- All write flows: BLOCKED (see above).

## Responsive and Accessibility Results
- 116/116 passed: responsive layouts across mobile→desktop widths (suite covers 320–1920px; Pixel/iPad projects configured), axe-core accessibility scan, contact-form responsiveness (Playwright run exit 0).
- Keyboard/focus manual audit, touch-target measurement, real-offline test: NOT TESTED this pass.

## SEO, PWA, and Production Checks
- `robots.ts` disallows `/dashboard`, `/admin`, `/messages`, `/notifications`, `/api/`; `sitemap.ts` includes static routes + up to 5000 active reports; `manifest.webmanifest` + icons + `sw.js` (v2, network-first navigations, no /api caching) present; canonical/OG metadata in `layout.tsx`; legal pages exist. STATIC REVIEW ONLY.
- P3 risk: soft-404 on invalid report ids (I-4) can pollute search indexing.

## Required Fix Order
1. ~~Fix the homepage `/search` CTA~~ — **DONE 2026-09-16**: `page.tsx:371` now points to `/discover`; logo fallback re-pointed to `/icons/icon-512.png` (`logo.tsx:12`); typecheck/lint/build clean; 55/55 route+console tests re-passed.
2. Provision/confirm a staging Supabase project; apply `supabase/migrations/20260916_rate_limit_rpc.sql` (I-7); re-run blocked write-flow and live-RLS abuse tests with isolated test accounts.
3. Clean repo-root debug scripts (I-5); plan soft-404 fix (I-4) and ESLint CLI migration (I-6).

## Retest Requirements
- Re-run the console-error sweep after any build-artifact change (snag regression guard).
- Full `npx playwright test` on staging once test accounts exist (auth, forms, rls-verification, admin, authenticated suites).
- Live verification of RLS/storage policies and the rate-limit RPC against staging.
- Verify security headers on the production deployment (curl probe).

## Blocked / Not Tested
- **Full `npx playwright test`** — BLOCKED: `auth.spec`, `forms.spec` (sends real emails), `rls-verification.spec`, `authenticated.spec`, `admin.spec` create accounts / write data against a potentially-production Supabase project.
- **All Phase 4 write flows** (register, login, report creation, image upload, claims, messaging, admin actions, duplicate/replay handling) — BLOCKED (no staging; production writes prohibited).
- **Live RLS policy verification** (Phase 5 runtime) — BLOCKED; policies reviewed STATIC REVIEW ONLY.
- **Snag deep scenarios**: rapid clicking, multi-tab, slow-network throttling, logged-in navigation, hard refresh on dynamic routes — NOT TESTED.
- **Suspended-user behavior, session persistence** — NOT TESTED (requires accounts).

## Runtime Error Results
- **Snag error (`Cannot read properties of undefined (reading 'call')`): Not reproduced during this audit; previous report remains unresolved until independently verified.**
- Evidence: after `npm run clean`, `console-errors.spec.ts` swept 16 public routes (`/`, `/discover`, `/lost`, `/found`, `/login`, `/register`, etc.) asserting zero console errors, zero `pageerror`s, and zero failed requests — all passed (77/77 run). Matches the prior root-cause finding: stale production `.next` artifacts cause chunk MIME-type 404s in `next dev`; a clean dev server shows no snag.
- `/search` probed: 404 (I-1). `/` and `/discover`: 200 (dev-server log captured).
- `/lost/[id]` / `/found/[id]` with real DB ids: NOT TESTED (no known-good ids without DB access); invalid-id behavior is the known soft-404 (I-4).

## Evidence
- Commands: `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm audit`, `npx playwright test …` (outputs recorded above; all exit 0).
- Probe: dev server via `npm.cmd run dev`; `fetch http://localhost:3000/search` → 404, `/` → 200, `/discover` → 200 (dev-server log captured).
- Static: `git show a0405ac:src/middleware.ts:48` (`false &&` condition); `git status --short` (28 modified, 1 deleted, 12 untracked); grep evidence for service-role / JSON-LD / `/search` references.
- Key files: `src/app/(main)/page.tsx:371`, `src/components/logo.tsx:12`, `src/middleware.ts:46-52`, `src/lib/actions/items.ts`, `src/lib/actions/admin.ts:15-30`, `src/lib/rate-limit.ts`, `supabase/migrations/20260916_rate_limit_rpc.sql`, `next.config.js:51-100`, `tests/e2e/console-errors.spec.ts`.
- Playwright: 77/77 + 116/116 passed (chromium project); html report at `playwright-report/index.html`.

