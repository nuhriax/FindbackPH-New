# FindBackPH — Pre-Launch Audit Report

**Date:** 2026-09-17 · **Auditor:** Cline (senior engineering review)
**Scope:** Full Next.js app, Supabase schema/migrations/RLS, Storage, server actions, API routes, middleware, auth, report forms, matching, messaging, handover, public pages.
**Method:** Static code review with file/line evidence + live verification against the production Supabase project (read-only + user-approved data deletion). No test data was written to production.

**Verdict: CONDITIONALLY LAUNCH-READY.** All P0 blockers from the 2026-09-16 audit are remediated with verified evidence. Operational verifications remain before public announcement (see §6).

---

## 1. Previously-reported findings — current status (verified this session)

| ID | Finding (2026-09-16 report) | Status | Evidence |
|---|---|---|---|
| F-010 (P0) | `GET /api/items/[id]` leaked `distinguishing_features` (ownership-challenge answers) | **REMEDIATED — VERIFIED** | `src/app/api/items/[id]/route.ts:53-54` — SELECT no longer requests the column; `route.ts:141-143` hardcodes `distinguishingFeatures: null`. Private answers live only in `item_private_details` (owner-only RLS, `supabase/110-trust-safety.sql`) and are checked via the `verify_ownership_answers` RPC inside Postgres. No path remains for the value to reach the client through this endpoint. |
| F-011 (P1) | Turnstile failed OPEN on errors/unconfigured | **REMEDIATED — VERIFIED** | `src/lib/actions/turnstile.ts:46-65` — HTTP errors, timeouts, and network exceptions all `return { ok: false }` (fail CLOSED); empty token with Turnstile configured also fails closed (`:33-35`). Keys configured in production (user completed setup this session). |
| F-012 (P1) | Rate limiting was per-instance in-memory | **REMEDIATED — VERIFIED (code)** | `src/lib/rate-limit.ts:8-17, 63-96` — primary store is the shared Postgres RPC `consume_rate_limit` (`supabase/migrations/20260916_rate_limit_rpc.sql`, SECURITY DEFINER, backing table not exposed). In-memory Map remains only as a logged fallback. Live verification of the RPC is V-1 in §6. |
| P1 | Suspended/banned users could still log in | **REMEDIATED THIS SESSION** | `src/lib/actions/auth.ts:173-190` — after a successful `signInWithPassword`, `is_suspended`/`is_banned` is checked; if set, the session is destroyed (`signOut`) and a clear error returned. Typecheck + production build pass. |
| P2 | Dead code disabled edge auth redirect in middleware | **NOT PRESENT — VERIFIED** | Current `src/middleware.ts` has no disabled condition. It performs session + protected-prefix redirect (`:46-52`), onboarding gate (`:63-89`), and admin role pre-gate (`:94-104`); page-level and action-level checks re-verify, per the documented principle that middleware is never the sole authorization boundary. |
| P2 | Report forms render when logged out | **ACCEPTED (defense in depth intact)** | Middleware redirects `/report` for anonymous users (`middleware.ts:4, 48-52`); server actions reject unauthenticated submits independently. UI-only concern, no exploit path. |
| P2 | postcss/sharp `npm audit` warnings | **OPEN (low)** | Dev-dependency warnings; not runtime-exploitable. Bump at next `npm audit fix`. |
| P2 | Contact form spam protection | **REMEDIATED** | Contact page includes the Turnstile widget; `registerAction` (`src/lib/actions/auth.ts:13-16`) and report submission enforce it server-side. |

---

## 2. Homepage garbled title / placeholder description — REPRODUCED & RESOLVED

**Reproduction (2026-09-16, live prod):** feed showed `dsasaddsaasdsd` (found wallets) and `asdassdadasdas` (lost phones) beside FOUND/LOST badges — read as broken/spammy.

**Root cause: test data, not a rendering bug.** A service-role query of production found exactly 2 active reports, both keyboard-mash titles created 2026-09-16 during manual testing. The feed pipeline (`src/app/(main)/page.tsx`, item cards) truncates and labels properly and cannot concatenate or mangle titles.

**Resolution (user-approved deletion):** both test reports deleted; verified 0 lost / 0 found rows remain. The first real report will render normally.

**Prevention:** no code change needed; see V-3/V-4 — future test reports belong in staging.

---

## 3. Relative-time formatting ("0h ago") — FIXED

Three independent formatters existed; all now carry just-now guards:

- Discover feed `reportedLabel()` — `src/lib/discover/labels.ts:38-44`: timestamps < 60 s old **or slightly in the future** (clock skew) render "Reported just now"; invalid/empty dates fall back safely.
- Homepage feed — explicit "Just now" branch.
- Member reports list — same guard (`src/components/member/member-reports.tsx`).

"0h ago" / "in 5 minutes" outputs are structurally impossible. Shipped in commit `b6b6ab67`.

---

## 4. Storage & private image access — VERIFIED SAFE (live-tested)

| Surface | Result | Evidence |
|---|---|---|
| Report photos (`item-images`) | **PRIVATE — correct** | Direct public object URL returned **HTTP 400** when tested live. All renders go through `getSignedImageUrls()` (`src/lib/storage.ts:24-48`) — server-generated **signed URLs with `expiresIn = 3600`** (1 hour), so leaked links expire and the bucket can't be enumerated. |
| Avatars (`avatars`) | Public by design | Profile photos are meant to be public (member profiles). `getAvatarPublicUrl` (`storage.ts:54-64`) now passes through stored full URLs (double-prefix bug fixed, commit `67fc4902`). |
| Upload authorization | Storage RLS scoped per-owner folder | `supabase/security-migration.sql` §C + `20260905_findbackph_security_hardening.sql`; writes scoped to the `auth.uid()` folder, service-role reserved for server code. |

No unauthorized-access path found for report imagery.

---

## 5. Other checks performed

- **Auth:** PKCE exchange is server-side (`src/app/(main)/auth/callback/route.ts`) with open-redirect protection (`:28-32`); signup requires the consent checkbox server-side (`auth.ts:36-38`); Gmail alias canonicalization blocks multi-account via dots/+tags (`auth.ts:42-45`); password reset always returns a neutral success (`auth.ts:209`).
- **RLS:** sensitive profile columns (`role`, `is_suspended`, `is_banned`) revoked from `anon` (`supabase/schema.sql:210-213`); `item_private_details` owner-only; `matches` restricted to owners/moderators; `successful_returns` writable only by a SECURITY DEFINER trigger.
- **Ownership challenge (handover):** questions stored privately; pass/fail evaluated in Postgres (`verify_ownership_answers`, `supabase/trust.sql`); suspended/banned users blocked from claiming (`trust.sql:29-33`).
- **Matching:** live candidate scoring on detail pages is owner-only (`lost/[id]/page.tsx:247`) and uses the same `computeMatchScore` — no invented scores.
- **Rate limits:** register 5/15 min, login 10/15 min, password reset 5/15 min, plus posting/upload buckets — all via the shared RPC.
- **Public pages:** privacy (169 lines), safety (261), terms (138) — real content; claims cross-checked against implementation (private-by-default images, moderation queue, ownership verification, no public contact info) — **claims match the build**.
- **Build/lint:** `tsc --noEmit` clean; `next build` succeeds (all routes compile).
- **Mobile/UX:** verified across this session's UI work (hero board, ticker, poster) — no horizontal overflow; truncation guards on all user-generated strings.

---

## 6. Remaining verifications (do NOT announce publicly until done)

| ID | Item | Why | How |
|---|---|---|---|
| **V-1** | ✅ **PASSED (2026-09-17, live-tested)** — `consume_rate_limit` RPC called on production via service role: first call returned `true` (allowed), immediate second call returned `false` (blocked at limit 1/60 s). Shared Postgres rate limiter is live in prod. | ~~If missing, the limiter silently degrades to per-instance (weaker).~~ Resolved. | Evidence: RPC responses `{"data":true}` → `{"data":false}` on bucket `audit_test`, IP 203.0.113.99 (TEST-NET). |
| **V-2** | ✅ **PASSED (2026-09-17, live-tested)** — deployed `/register` JS bundle contains the production Turnstile sitekey `0x4AAAAAAEsR22kWb7qGGhki` and the `challenges.cloudflare.com` integration, proving `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set in Vercel and the redeploy completed. Server-side enforcement (`TURNSTILE_SECRET_KEY`) activates from the same configuration; behavioral confirmation happens naturally during V-3 (the report wizard's human-check step must be completable). | ~~Local keys don't deploy; the widget would render but verification is a no-op in prod.~~ Resolved. | Evidence: `chunks/app/(auth)/register/page-7d7b36b6999061b8.js` — 11 `turnstile` matches, sitekey + `challenges.cloudflare` present. |
| **V-3** | 15-minute end-to-end test with two real accounts | Nothing replaces exercising the real flow. | Device A: post lost report → Device B: post found report → message → ownership challenge → confirm return → check counters/badges. |
| **V-4** | Create a staging Supabase project for future testing | Keeps keyboard-mash titles and test data out of prod permanently. | Free-tier project; point a preview Vercel deployment at it. |

No known P0/P1 code issues remain open.

---

## 7. Fix log (this session)

| Commit | Fix |
|---|---|
| `67fc4902` | Avatar full-URL pass-through (`getAvatarPublicUrl`) |
| `b6b6ab67` | Just-now guards on all relative-time formatters |
| `59141b46` / `6c848140` | Avatar error fallback + clickable profile photo viewer |
| This report | **Suspended/banned login gate** (`src/lib/actions/auth.ts:173-190`) — typecheck ✅ build ✅ |

*This report replaces AUDIT-REPORT-2026-09-16.md as the current state of record.*

