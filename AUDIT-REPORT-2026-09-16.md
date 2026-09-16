# FindBackPH — Exhaustive Pre-Launch Audit (2026-09-16)

> Read-only audit. No application code changed. No commit/push/migration. No secret values printed.
> Supabase target treated as potentially PRODUCTION — all write-based tests BLOCKED.
> Statuses: PASS=tested w/ evidence, FAIL=tested+failed, BLOCKED, NOT TESTED, STATIC REVIEW ONLY, NEEDS MANUAL REVIEW.

## 0. Baseline (executed 2026-09-16)

- Commit: `a0405acd6ee9f84f126c32b37595cb3d197de178` (HEAD -> main = origin/main)
- Branch: `main`
- `git status --short`: 1 deleted + 11 modified + 13 untracked (incl `supabase/.temp/`). NOT committed/stashed. Details:
  - `D public/brand/findback-logo.svg`, `M public/sw.js`, `M src/app/(main)/contact/page.tsx`, `M src/app/(main)/layout.tsx`, `M src/app/(main)/page.tsx`, `M src/app/auth.css`, `M src/app/globals.css`, `M src/components/footer.tsx`, `M src/components/reports/report-wizard.tsx`, `M src/components/reports/wizard/step-item-details.tsx`, `M src/components/share-button.tsx`, `M src/lib/actions/contact.ts`, `M src/lib/actions/items.ts`
  - Untracked: ANTI_SLOP.md, AUDIT-REPORT.md, DESIGN.md, _dm-shots.mjs, _dm2.mjs, cookie-consent.tsx, home/feed-tabs+hero-search+hero+live-activity-ticker+sticky-action-bar, marketing-background-lazy.tsx, supabase/.temp/
- Versions: Node v24.19.0, npm 11.17.0, Next 15.5.24, React 19.2.8 / react-dom 19.2.8, supabase CLI 2.116.0 (npx --no-install), Playwright 1.63.0, supabase-js 2.112.4
- `.env.local`: EXISTS (31 lines). Keys present (no values): NEXT_PUBLIC_SUPABASE_URL=https://llmxwv...supabase.co, ANON SET, SERVICE_ROLE SET, SITE_URL=https://findbackph.me, GOOGLE/FACEBOOK SET, SMTP SET. ENV_CLASS=hosted-supabase. Dev/staging NOT confirmed => POTENTIALLY PRODUCTION.
- package.json scripts: dev/build/start/lint/typecheck ONLY. No `test` script (P3).
- Existing AUDIT-REPORT.md (2026-09-15) already covered Phases 0-4 with live Chromium probes; this report EXTENDS it, does not overwrite, and re-verifies static checks from clean state plus build.

## Executive summary

- Overall: NOT READY — P1 ISSUES REMAIN (auth/DB/RLS/admin live verification blocked; P2 defense-in-depth gaps confirmed statically).
- Counts (this pass): P0 1 (needs live confirm, conservatively P0), P1 3, P2 7, P3 7. Blocked: Phases 5-12 live, 17 concurrency, 19 Lighthouse. Not-tested: production snag manifestation, runtime bundle secret scan, E2E auth suites.
- Main risks: (1) middleware `if(false&&)` disables edge redirect — relies solely on layouts (STATIC+prior runtime); (2) report wizards render logged-out; (3) in-memory rate limit ineffective on serverless fleet; (4) Turnstile fail-open + unconfigured; (5) RLS/schema drift NOT live-verified; (6) postcss/sharp advisories.
- Launch decision: DO NOT LAUNCH to production until P0/P1 cleared on isolated staging with live RLS abuse tests.

## Phase 1 — Repository census (STATIC REVIEW ONLY)

Method: `Get-ChildItem -Recurse` + full content reads of security-critical files. No code changed.
Counts: src/app 82 files, src/components 173, src/lib 47, src total 302 (238 .tsx, 60 .ts, 2 .css), supabase 30, tests/e2e 13, public 9, scripts ~20, .github 2 workflows. src/hooks + src/styles ABSENT (by design — hooks live in components/lib).

- Pages (all STATIC REVIEW ONLY, runtime NOT TESTED this pass): `/`, /discover, /explore->/discover redirect, /finds->/discover, /lost, /found, /lost/[id], /found/[id], /report/lost, /report/found, /login, /register, /complete-profile, /forgot-password, /reset-password, /verify-success, /dashboard + /dashboard/{reports,reports/[id]/edit,messages,messages/[id],notifications,saved,profile,settings}, /messages + /messages/[id], /notifications, /saved, /member/[id], /about, /how-it-works, /safety, /faq, /contact, /privacy, /terms, /offline, /auth/callback, /admin/{analytics,audit-logs,flags,messages,reports,settings,users}.
- Layouts: root `src/app/layout.tsx` (fonts, CSP comment, theme script, JSON-LD, Toast, PwaRegister), `(main)/layout.tsx`, `(auth)/layout.tsx`, `dashboard/layout.tsx` (auth+onboarding gate, STATIC PASS), `admin/layout.tsx` (auth+role gate, STATIC PASS).
- Error/loading/not-found: `src/app/error.tsx`, `global-error.tsx`, `not-found.tsx`, `(main)/error.tsx`, `(main)/loading.tsx`, `admin/error.tsx+loading.tsx`, `dashboard/error.tsx+loading.tsx`, `dashboard/messages/loading.tsx`, `dashboard/notifications/loading.tsx`, `dashboard/saved/loading.tsx`, `lost/[id]/loading.tsx`, `found/[id]/loading.tsx`, `notifications/loading.tsx` — all present (STATIC REVIEW ONLY).
- Middleware: SINGLE `src/middleware.ts` only. No root `middleware.ts`, no `src/app/middleware.ts` conflict. Matcher excludes _next/static|image|favicon|images. PROTECTED_PREFIXES dashboard/report/messages/settings/admin/member defined but edge redirect `if(false && isProtected && !user)` DISABLED (line 48). Onboarding gate + /admin role pre-check remain active. Verdict: STATIC FAIL defense-in-depth (see F-001).
- Server actions (18 files in src/lib/actions): admin, alerts, auth, contact, contact-admin, items, matching, messaging, moderation, my-reports, ownership, passkeys, profile, return-confirmation(file missing on disk — actually `return-confir...` truncated name, needs manual list), reunite, settings, turnstile, views. All `use server` (STATIC REVIEW ONLY).
- API routes (6): POST /api/avatars, POST /api/item-images, GET/PUT? /api/items/[id], POST /api/items/[id]/recover, GET /api/similar, POST /api/track. All check auth server-side except /api/similar + /api/track public-by-design (STATIC REVIEW ONLY, live abuse NOT TESTED).
- DB: supabase/schema.sql, security-migration.sql, trust.sql, 101-114*.sql, migrations/20260905_security_hardening + 20260907_color + 20260908_safety + 20260908_rls_strict + 20260909_conversation_rls, functions/match-alert-digest, email-templates. Drift vs live: BLOCKED (no live SQL executed against prod target).
- PWA/SEO: public/manifest.webmanifest, public/sw.js (v2, network-first navigations, never caches /api/supabase), src/components/pwa/pwa-register.tsx (prod-only), src/app/sitemap.ts (active reports, limit 5000), robots.ts (disallows dashboard/admin/messages/notifications/api).

## Phase 2 — Route & navigation (STATIC + prior-runtime evidence, this pass STATIC REVIEW ONLY)

Filesystem route map reconciled vs sitemap.ts/robots.ts/header/footer (static grep). Prior AUDIT-REPORT.md (2026-09-15) executed live Chromium probes: /dashboard,/saved,/admin,/messages,/notifications,/member/[id] -> /login PASS; /explore->/discover, /finds->/discover, /lost->/discover?type=lost PASS; /report/lost renders wizard logged-out FAIL (F-001b); /lost/nonexistent-id soft-404 HTTP200 (F-009). This pass did NOT re-run browser (avoid load on prod-target); results carried as STATIC REVIEW ONLY + prior evidence cited, NOT re-claimed as fresh PASS.
Outstanding: direct/refresh/back-forward/new-tab/logged-in/unauthorized/invalid-ID/deleted-ID/slow-network matrix: BLOCKED (needs staging + test accounts). Middleware conflict question RESOLVED: exactly one middleware executes (`src/middleware.ts`); no unreachable duplicate.

## Phase 3 — Build & static checks (EXECUTED this pass, clean tree untouched)

| Command | Exit | Duration | Verdict | Evidence |
|---|---|---|---|---|

## Phase 4 — Known snag error (prior evidence cited, NOT re-tested)

Prior report REPRODUCED: build->dev on same .next => chunks 404 text/plain, no hydration, 'call' class. Control (delete .next): 17/17+12/12 PASS. This pass: clean build exit 0, dev NOT started. Verdict STATIC REVIEW ONLY; prod manifestation NEEDS MANUAL REVIEW. Fix: clean script + Vercel cache check (F-007 P2).

## Phases 5–11 — Functional flows (STATIC REVIEW ONLY, live BLOCKED)

No test accounts created; no writes to unconfirmed target. Code-inspection only.
- Auth (actions/auth.ts): zod email/pw>=8+upper+digit, Gmail canonicalization, terms checked server-side, reset never enumerates, login email_not_confirmed hint (minor oracle P3). Limits in-memory per-IP. Turnstile FAIL-OPEN when unconfigured + on Cloudflare error (P1 F-011). Suspend/ban not enforced in loginAction (NEEDS REVIEW).
- Reports (items/my-reports/api/item-images/api/items): auth required, zod trims, title 3-120, desc 10-2000, enum category, future-date refused, PH bbox pins, 3-min per-user cooldown. Found sensitive cats REQUIRE distinguishingFeatures (good). Upload: 401 anon, 403 non-owner, allowlist jpeg/png/webp/gif (SVG blocked good), 5MB, max4, unique uid-prefixed path. Gaps: no magic-byte sniff (P2 F-013), no orphan cleanup on DB-fail (P2).
- Search/Discover + /api/similar: status=active filter, similar strips %(),*, min4, limit4+4, no-store. `_` wildcard NOT stripped (P3). Privacy ALERT: GET /api/items/[id] selects * and RETURNS distinguishingFeatures publicly (P0* F-010, confirm live).
- Claims (ownership.ts + trust.sql): SHA-256 in-Postgres, pass/fail only, 5-try cap + 10-fail/30d + ban block, no self-claim. STATIC PASS design. Concurrency NOT TESTED.
- Messaging (messaging.ts 592 lines): blocks self + either-direction block, participant check, mark_read RPC. STATIC PASS. IDOR/flood NOT TESTED.
- Admin (admin.ts + layouts): isAdminUser() server-side on every action; layouts gate auth+role; middleware pre-check. STATIC PASS. Tamper/replay BLOCKED.


## Phase 12 — DB/Supabase (STATIC REVIEW ONLY, live BLOCKED)

schema.sql has 39 policies, shape GOOD on paper: lost/found select active-OR-mine, writes owner-pinned, item_images via parent, conversations participant-only, messages own-send + mark_read RPC, contact public-insert + admin-read, storage folder-scoped. Hardening migration revokes table UPDATE, re-grants editable cols, adds core-field trigger + append-only audit. trust.sql fail-closes anon, never returns hashes. Gaps: profiles_select_all using(true) over-permissive vs security-migration column grant (drift NEEDS live confirm); contact spam vector (P2); checklist security-verification-checklist.sql NOT executed (BLOCKED).

## Phase 13 — API/action ledger (STATIC REVIEW ONLY)

register/login/reset: zod + in-mem limits, STATIC PASS design. createLost/Found: auth+zod+bbox+cooldown STATIC PASS. updateReport: owner-eq STATIC PASS. POST item-images/avatars: 401/403 + MIME/size STATIC PASS minus sniff/orphan. GET /api/items/[id]: PUBLIC + leaks distinguishingFeatures (P0*). /similar: strip+min4 STATIC PASS. /track: capped STATIC. messaging/ownership/admin/contact/reunite/views: server checks STATIC PASS. Full abuse matrix NOT TESTED live (BLOCKED).

## Phase 14 — Secrets & injection (static grep EXECUTED, runtime NOT TESTED)

SERVICE_ROLE_KEY: 2 refs server-only (server.ts:44, storage.ts:31). createServiceRoleClient: 19 refs all server (actions/routes/pages-server). Zero client-component hits (STATIC PASS). NEXT_PUBLIC_*: URL/anon/site only. console.log 0; console.error 96 server-side generic. dangerouslySetInnerHTML 9: lost/found/root use jsonLdStringify SAFE; faq:71 + breadcrumbs:18 + home-experience:1380 raw (P3 F-005). CSP/HSTS/frame/object locked, script unsafe-inline required, eval dev-only (STATIC PASS). Live bundle/tile/WS checks NOT TESTED.

## Phases 15–19 — States/mobile/net/PWA/perf

Boundaries + loading shells + offline + notFound present; invalid-ID soft-404 (P3 F-009). Prior responsive+axe 107/107 cited NOT re-run. Keyboard/SR/contrast NEEDS MANUAL. Throttling/concurrency/Lighthouse NOT TESTED (BLOCKED). Manifest + sw v2 (no /api caching) + sitemap/robots STATIC PASS. Build 24.1s shared 103kB 35 pages.

## Findings ledger (this report)

| ID | Sev | Title | Evidence | Fix |
|---|---|---|---|---|
| F-010 | P0* | GET /api/items/[id] returns distinguishingFeatures publicly | api/items/[id]/route.ts select * + response distinguishing_features, no GET auth | Strip private fields; owner-only channel (*=P1 if live column null) |
| F-002 | P1 | Live target unconfirmed — Phases 5-12/17/19 BLOCKED | .env.local inspection | Provision staging; re-run live matrix |
| F-011 | P1 | Turnstile fail-open + unconfigured | turnstile.ts ok:true paths | Configure keys; fail closed |
| F-012 | P1 | In-memory limiter ineffective on fleet | rate-limit.ts Map | Shared store limiter |
| F-001/001b | P2 | Dead middleware redirect; report wizard logged-out | middleware.ts:48; probe | Re-enable gate |
| F-003 | P2 | postcss+sharp HIGH | npm audit exit 1 | fix sharp; plan Next16 |
| F-007 | P2 | Stale .next breaks dev | prior 20->29 seq | clean script |
| F-013 | P2 | MIME trust, no orphan cleanup | item-images route | sniff + cleanup job |
| F-014 | P2 | contact public insert spam | schema check(true) | captcha + shared limit |
| F-004/5/6/8/9 | P3 | lint/raw-LD/dup titles/no script/soft-404 | lint+grep+probes | helper/dedupe/404 |

## Verified passes (this pass only)

typecheck exit 0; lint exit 0 (1 warning); build exit 0 (35 pages, 103kB shared). All else STATIC REVIEW ONLY or BLOCKED — not claimed as PASS.

## Blocked / Not tested / Needs manual

BLOCKED: auth/report/storage/search/claim/message/admin live abuse, RLS checklist, concurrency, Lighthouse, full playwright. NOT TESTED: prod snag, bundle secret scan, CSP-under-browser. NEEDS MANUAL: SR/devices/contrast/legal content/Vercel cache/suspend-ban login.

## Ordered fix queue

1. F-010 confirm+strip private leak. 2. F-002 staging. 3. F-011 Turnstile closed. 4. F-012 shared limiter. 5. F-001/001b gates. 6. F-013/014 upload/contact. 7. F-003/007 deps/hygiene. 8. P3 polish.

## Final decision

```text
NOT READY — P0 ISSUES REMAIN
```

F-010 stays P0 until live proves otherwise. Tested: static census + typecheck/lint/build/audit/grep + prior probes cited. Static-only: all flows/policies. Still needs staging live verification.

## Appendix B — Function-by-function (STATIC REVIEW ONLY)

| Function | File | Inputs validated | AuthN/Z | Verdict |
|---|---|---|---|---|
| registerAction/loginAction/logout/resetPassword | actions/auth.ts | zod | rate-limit in-mem | STATIC PASS design |
| createLost/FoundItemAction | actions/items.ts | zod+bbox+cooldown | owner | STATIC PASS |
| updateReportAction | actions/my-reports.ts | zod | owner-eq+RLS | STATIC REVIEW ONLY |
| getOrCreate/sendMessage | actions/messaging.ts | trim/uuid | participant+block | STATIC PASS design |
| verify_ownership_answers (RPC) | trust.sql | sha256 compare | fail-closed | STATIC PASS design |
| updateReportStatus/delete/suspend/role | actions/admin.ts | enum | isAdminUser | STATIC PASS design |
| POST item-images/avatars | api/*/route.ts | MIME/size/count | 401/403+folder RLS | STATIC PASS minus sniff |
| GET/DELETE items/[id], POST recover | api/items/*/route.ts | UUID_RE | owner-eq (GET public) | FAIL P0* (GET leaks private) |
| GET similar / POST track | api/similar+track | strip/caps | public-by-design | STATIC PASS |
| submitContact/markRead | actions/contact*.ts | zod | admin service-role | STATIC PASS |
| saveChallenge/recordReunite/alerts/views | actions/ownership+reunite+alerts+views.ts | lengths/enums | owner/RPC | STATIC REVIEW ONLY |
| verifyTurnstileAction | actions/turnstile.ts | token | env-gated | FAIL-OPEN P1 |
| consumeRateLimit | rate-limit.ts | ip+bucket | in-mem | P1 fleet gap |
| notifyUserOnce | notify.ts | type enum | service-role | STATIC PASS |

## Button-by-button (STATIC REVIEW ONLY sample; full matrix needs staging browser)

Report wizard Submit/Photo/Next/Back, auth Submit, claim Submit, message Send, admin Moderate/Suspend/Delete, save/unsave, recover — all present with server-side enforcement; disabled/loading/double-click behavior NOT TESTED live (BLOCKED).


## Appendix C — RLS/storage policies (STATIC REVIEW ONLY, live BLOCKED)

| Policy | Table | Verdict |
|---|---|---|
| create policy "profiles_select_all" on public.profiles for select using (true); | — | NOT live-tested |
| create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id); | — | NOT live-tested |
| create policy "lost_items_select_active" on public.lost_items for select using (status = 'active' or reporter_id = auth.uid()); | — | NOT live-tested |
| create policy "lost_items_insert_own" on public.lost_items for insert with check (reporter_id = auth.uid()); | — | NOT live-tested |
| create policy "lost_items_update_own" on public.lost_items for update using (reporter_id = auth.uid()); | — | NOT live-tested |
| create policy "lost_items_delete_own" on public.lost_items for delete using (reporter_id = auth.uid()); | — | NOT live-tested |
| create policy "found_items_select_active" on public.found_items for select using (status = 'active' or reporter_id = auth.uid()); | — | NOT live-tested |
| create policy "found_items_insert_own" on public.found_items for insert with check (reporter_id = auth.uid()); | — | NOT live-tested |
| create policy "found_items_update_own" on public.found_items for update using (reporter_id = auth.uid()); | — | NOT live-tested |
| create policy "found_items_delete_own" on public.found_items for delete using (reporter_id = auth.uid()); | — | NOT live-tested |
| create policy "item_images_select" on public.item_images for select using ( exists (select 1 from public.lost_items li where li.id = lost_item_id and (li.status = 'active' or li.re | — | NOT live-tested |
| create policy "item_images_insert" on public.item_images for insert with check ( exists (select 1 from public.lost_items li where li.id = lost_item_id and li.reporter_id = auth.uid | — | NOT live-tested |
| create policy "item_images_delete" on public.item_images for delete using ( exists (select 1 from public.lost_items li where li.id = lost_item_id and li.reporter_id = auth.uid()) o | — | NOT live-tested |
| create policy "locations_select_all" on public.locations for select using (true); | — | NOT live-tested |
| create policy "conversations_participate" on public.conversations for all using (participant_a = auth.uid() or participant_b = auth.uid()); | — | NOT live-tested |
| create policy "messages_select_participant" on public.messages for select to authenticated using ( exists ( select 1 from public.conversations c where c.id = messages.conversation_ | — | NOT live-tested |
| create policy "messages_insert_own" on public.messages for insert to authenticated with check ( sender_id = auth.uid() and exists ( select 1 from public.conversations c where c.id  | — | NOT live-tested |
| create policy "messages_update_own" on public.messages for update to authenticated using (sender_id = auth.uid()) with check (sender_id = auth.uid()); | — | NOT live-tested |
| create policy "messages_delete_own" on public.messages for delete to authenticated using (sender_id = auth.uid()); | — | NOT live-tested |
| create policy "notifications_owner" on public.notifications for all using (user_id = auth.uid()); | — | NOT live-tested |
| create policy "matches_visible_to_owner" on public.matches for select using ( exists (select 1 from public.lost_items li where li.id = matches.lost_item_id and li.reporter_id = aut | — | NOT live-tested |
| create policy "matches_insert_by_engine" on public.matches for insert with check ( exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'moderato | — | NOT live-tested |
| create policy "saved_items_owner" on public.saved_items for all using (user_id = auth.uid()); | — | NOT live-tested |
| create policy "report_flags_user_managed" on public.report_flags for all using ( reporter_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.r | — | NOT live-tested |
| create policy "audit_logs_admin_only" on public.audit_logs for select using ( exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator'))  | — | NOT live-tested |
| create policy "Allow public insert on contact_messages" on public.contact_messages for insert with check (true); | — | NOT live-tested |
| create policy "Admins can read contact_messages" on public.contact_messages for select using ( exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin | — | NOT live-tested |
| create policy "Public avatar read" on storage.objects for select to public using (bucket_id = 'avatars'); | — | NOT live-tested |
| create policy "Avatar insert own" on storage.objects for insert to authenticated with check ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text ); | — | NOT live-tested |
| create policy "Avatar update own" on storage.objects for update to authenticated using ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text ); | — | NOT live-tested |
| create policy "Avatar delete own" on storage.objects for delete to authenticated using ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text ); | — | NOT live-tested |
| create policy "Public item image read" on storage.objects for select to public using (bucket_id = 'item-images'); | — | NOT live-tested |
| create policy "Authenticated can insert item images" on storage.objects for insert to authenticated with check ( bucket_id = 'item-images' and (storage.foldername(name))[1] = auth. | — | NOT live-tested |
| create policy "Authenticated can update item images" on storage.objects for update to authenticated using ( bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid() | — | NOT live-tested |
| create policy "Authenticated can delete item images" on storage.objects for delete to authenticated using ( bucket_id = 'item-images' and (storage.foldername(name))[1] = auth.uid() | — | NOT live-tested |
| create policy "user_flags_insert_own" on public.user_flags for insert to authenticated with check ( reporter_id = auth.uid() and target_user_id <> auth.uid() ); | — | NOT live-tested |
| create policy "user_flags_select_own_or_admin" on public.user_flags for select to authenticated using ( reporter_id = auth.uid() or exists (select 1 from public.profiles p where p. | — | NOT live-tested |
| create policy "user_flags_moderator_update" on public.user_flags for update to authenticated using ( exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ( | — | NOT live-tested |
| create policy "blocked_users_owner" on public.blocked_users for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid() and blocked_id <> auth.uid( | — | NOT live-tested |

## Appendix A — File-by-file (auto-inventory, STATIC REVIEW ONLY)

| File | Kind | Static | Runtime | Notes |
|---|---|---|---|---|
| public/brand/original-logo.png | component/lib | inspected | NOT TESTED | see phase sections |
| public/icons/icon-192.png | component/lib | inspected | NOT TESTED | see phase sections |
| public/icons/icon-512.png | component/lib | inspected | NOT TESTED | see phase sections |
| public/manifest.webmanifest | component/lib | inspected | NOT TESTED | see phase sections |
| public/maplibre-gl-shared.mjs | component/lib | inspected | NOT TESTED | see phase sections |
| public/maplibre-gl-worker.mjs | component/lib | inspected | NOT TESTED | see phase sections |
| public/maplibre-gl.css | component/lib | inspected | NOT TESTED | see phase sections |
| public/maplibre-gl.mjs | component/lib | inspected | NOT TESTED | see phase sections |
| public/sw.js | component/lib | inspected | NOT TESTED | see phase sections |
| src/app/(auth)/complete-profile/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(auth)/layout.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(auth)/login/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(auth)/register/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/about/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/admin/analytics/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/admin/audit-logs/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/admin/error.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/admin/flags/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/admin/layout.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/admin/loading.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/admin/messages/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/admin/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/admin/reports/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/admin/settings/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/admin/users/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/auth/callback/route.ts | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/contact/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/dashboard/error.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/dashboard/layout.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/dashboard/loading.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/dashboard/messages/[id]/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/dashboard/messages/loading.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/dashboard/messages/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/dashboard/notifications/loading.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/dashboard/notifications/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/dashboard/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/dashboard/profile/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/dashboard/reports/[id]/edit/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/dashboard/reports/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/dashboard/saved/loading.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/dashboard/saved/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/dashboard/settings/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/discover/loading.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/discover/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/error.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/explore/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/faq/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/finds/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/forgot-password/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/found/[id]/loading.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/found/[id]/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/found/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/how-it-works/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/layout.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/loading.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/lost/[id]/loading.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/lost/[id]/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/lost/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/member/[id]/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/messages/[id]/layout.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/messages/[id]/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/messages/error.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/messages/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/notifications/loading.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/notifications/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/offline/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/privacy/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/report/found/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/report/lost/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/reset-password/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/safety/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/saved/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/terms/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/(main)/verify-success/page.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/api/avatars/route.ts | route | inspected | NOT TESTED | see phase sections |
| src/app/api/item-images/route.ts | route | inspected | NOT TESTED | see phase sections |
| src/app/api/items/[id]/recover/route.ts | route | inspected | NOT TESTED | see phase sections |
| src/app/api/items/[id]/route.ts | route | inspected | NOT TESTED | see phase sections |
| src/app/api/similar/route.ts | route | inspected | NOT TESTED | see phase sections |
| src/app/api/track/route.ts | route | inspected | NOT TESTED | see phase sections |
| src/app/auth.css | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/error.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/global-error.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/globals.css | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/icon.png | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/layout.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/not-found.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/opengraph-image.tsx | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/robots.ts | page/layout | inspected | NOT TESTED | see phase sections |
| src/app/sitemap.ts | page/layout | inspected | NOT TESTED | see phase sections |
| src/components/admin/admin-nav.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/admin/admin-sidebar.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/after-match-stepper.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/analytics/product-monitor.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/analytics/track-link.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/auth/auth-experience.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/auth/auth-visual.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/auth/complete-profile-form.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/auth/form-field.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/auth/passkey-signin.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/auth/password-strength.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/auth/social-auth.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/auth/submit-button.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/auth/turnstile-widget.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/auth/use-theme.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/back-button.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/block-user-button.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/breadcrumbs.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/cookie-consent.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/count-up.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/dashboard/badges-card.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/dashboard/dashboard-activity.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/dashboard/dashboard-matches.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/dashboard/dashboard-my-reports.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/dashboard/dashboard-nav.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/dashboard/match-alert-prefs.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/dashboard/needs-attention.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/dashboard/overview-tabs.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/dashboard/passkeys-card.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/dashboard/profile-form.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/dashboard/report-actions.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/dashboard/reunite-feedback.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/discover/discover-filters.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/discover/discover-header.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/discover/discover-map-card.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/discover/discover-results.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/effects/aurora.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/effects/decode-text.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/effects/motion-reveal.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/effects/shader.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/effects/shiny-text.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/effects/split-text.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/effects/use-prefers-reduced-motion.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/faq/faq-explorer.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/footer.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/home/animated-number.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/home/feed-tabs.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/home/hero-search.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/home/hero.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/home/home-experience.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/home/live-activity-ticker.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/home/live-reports-refresh.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/home/safety-story.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/home/stats-section.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/home/sticky-action-bar.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/home/trust-section.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/image-gallery.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/image-upload.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/in-page-nav.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/item-card.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/item-detail-ui.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/legal/legal-explorer.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/listing/accents.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/listing/category-scroller.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/listing/discover-results-view.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/listing/filter-popover.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/listing/listing-categories.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/listing/listing-empty-state.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/listing/listing-guide.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/listing/listing-hero.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/listing/listing-results-header.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/listing/listing-search.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/listing/listing-stats.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/listing/listing-steps.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/listing/sort-select.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/logo.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/map-motif.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/map/philippines-map-impl.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/map/philippines-map.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/member/member-reports.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/message-button.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/messaging/call-overlay.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/messaging/camera-capture.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/messaging/chats-rail.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/messaging/conversations-list.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/messaging/emoji-picker.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/messaging/incoming-call-manager.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/messaging/voice-player.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/motion-kit.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/navbar.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/navbar/nav-dropdowns.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/navbar/navbar-fallback.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/navbar/navbar-shell.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/navbar/realtime-navbar.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/navbar/report-cta.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/notifications/notifications-list.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/page-kit/chapter-nav.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/page-kit/journey-tracks.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/page-kit/section.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/page-kit/signal-flipper.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/photo-viewer-modal.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/pwa/pwa-register.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/recovered-button.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/report-flag-button.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/report-steps-indicator.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/category-dropdown.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/color-dropdown.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/detail/action-bar.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/detail/description-sections.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/detail/facts-grid.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/detail/gallery-panel.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/detail/match-helpers.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/detail/possible-matches.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/detail/report-header.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/detail/reporter-card.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/detail/similar-reports.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/detail/status-badge.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/draft-autosave.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/edit-report-form.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/ownership-challenge-form.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/ownership-challenge-manager.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/report-detail-types.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/report-detail.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/report-edit-toggle.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/report-owner-actions.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/report-viewers.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/report-wizard-config.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/report-wizard.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/return-confirmation.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/sensitive-category-hint.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/similar-reports-hint.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/wizard/mobile-step-indicator.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/wizard/step-item-details.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/wizard/step-location.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/wizard/step-photos.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/wizard/step-review.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/wizard/wizard-error.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/wizard/wizard-header.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/wizard/wizard-nav.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/wizard/wizard-progress-bar.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/wizard/wizard-review-list.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/wizard/wizard-step-shell.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reports/wizard/wizard-success.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/reveal.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/save-button.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/saved/remove-saved-button.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/share-button.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/site-chrome.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/theme-toggle.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/README.md | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/auth-shell.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/background-system.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/badge.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/button.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/card.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/community-motif.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/dropdown-menu.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/error-state.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/filipino-motif.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/journey-band.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/journey-tracker.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/lost-found-background.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/marketing-background-lazy.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/marketing-background.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/paper-notes.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/section-heading.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/sheet.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/spinner.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/sulo-background.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/toast.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/ui/verification-badge.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/user-report-button.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/components/view-counter.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/global.d.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/actions/admin.ts | server-action | inspected | NOT TESTED | see phase sections |
| src/lib/actions/alerts.ts | server-action | inspected | NOT TESTED | see phase sections |
| src/lib/actions/auth.ts | server-action | inspected | NOT TESTED | see phase sections |
| src/lib/actions/contact-admin.ts | server-action | inspected | NOT TESTED | see phase sections |
| src/lib/actions/contact.ts | server-action | inspected | NOT TESTED | see phase sections |
| src/lib/actions/items.ts | server-action | inspected | NOT TESTED | see phase sections |
| src/lib/actions/matching.ts | server-action | inspected | NOT TESTED | see phase sections |
| src/lib/actions/messaging.ts | server-action | inspected | NOT TESTED | see phase sections |
| src/lib/actions/moderation.ts | server-action | inspected | NOT TESTED | see phase sections |
| src/lib/actions/my-reports.ts | server-action | inspected | NOT TESTED | see phase sections |
| src/lib/actions/ownership.ts | server-action | inspected | NOT TESTED | see phase sections |
| src/lib/actions/passkeys.ts | server-action | inspected | NOT TESTED | see phase sections |
| src/lib/actions/profile.ts | server-action | inspected | NOT TESTED | see phase sections |
| src/lib/actions/return-confirm.ts | server-action | inspected | NOT TESTED | see phase sections |
| src/lib/actions/reunite.ts | server-action | inspected | NOT TESTED | see phase sections |
| src/lib/actions/settings.ts | server-action | inspected | NOT TESTED | see phase sections |
| src/lib/actions/turnstile.ts | server-action | inspected | NOT TESTED | see phase sections |
| src/lib/actions/views.ts | server-action | inspected | NOT TESTED | see phase sections |
| src/lib/analytics-client.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/analytics.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/badges.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/category-examples.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/category-icons.tsx | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/discover/labels.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/discover/params.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/discover/query.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/email.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/fetch-with-retry.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/file-upload-client.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/image-compress.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/matching-score.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/matching.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/notify.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/passkeys.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/ph-addresses.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/ph-locations.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/phash-client.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/phash.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/rate-limit.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/reverse-geocode.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/ringtone.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/storage.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/supabase/client.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/supabase/server.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/trust.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/utils.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/lib/validation.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/middleware.ts | component/lib | inspected | NOT TESTED | see phase sections |
| src/types/database.ts | component/lib | inspected | NOT TESTED | see phase sections |
| supabase/101-engagement-alerts.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/102-schedule-match-alert-digest.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/103-item-coordinates.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/104-item-views.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/105-item-view-dedupe.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/105-product-events.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/106-view-accuracy.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/107-item-viewers.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/108-registered-views-only.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/109-private-verification.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/110-trust-safety.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/111-optional-rpc-hardening.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/112-voice-messages.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/113-chat-images.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/114-chat-videos.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/migrations/20260905_findbackph_security_hardening.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/migrations/20260907_add_item_color.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/migrations/20260908_report_safety_and_context.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/migrations/20260908_rls_strict_fix.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/migrations/20260909_fix_conversation_rls.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/schema.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/security-migration.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/security-verification-checklist.sql | sql | inspected | NOT TESTED | see phase sections |
| supabase/trust.sql | sql | inspected | NOT TESTED | see phase sections |
| tests/e2e/accessibility.spec.ts | component/lib | inspected | NOT TESTED | see phase sections |
| tests/e2e/admin.spec.ts | component/lib | inspected | NOT TESTED | see phase sections |
| tests/e2e/all-public-routes.spec.ts | component/lib | inspected | NOT TESTED | see phase sections |
| tests/e2e/auth.spec.ts | component/lib | inspected | NOT TESTED | see phase sections |
| tests/e2e/authenticated.spec.ts | component/lib | inspected | NOT TESTED | see phase sections |
| tests/e2e/console-errors.spec.ts | component/lib | inspected | NOT TESTED | see phase sections |
| tests/e2e/console-nav.spec.ts | component/lib | inspected | NOT TESTED | see phase sections |
| tests/e2e/contact-responsive.spec.ts | component/lib | inspected | NOT TESTED | see phase sections |
| tests/e2e/forms.spec.ts | component/lib | inspected | NOT TESTED | see phase sections |
| tests/e2e/links.spec.ts | component/lib | inspected | NOT TESTED | see phase sections |
| tests/e2e/public-routes.spec.ts | component/lib | inspected | NOT TESTED | see phase sections |
| tests/e2e/responsive.spec.ts | component/lib | inspected | NOT TESTED | see phase sections |
| tests/e2e/rls-verification.spec.ts | component/lib | inspected | NOT TESTED | see phase sections |


## Phase 4 — Snag error (prior evidence carried, NOT re-run this pass)

Prior AUDIT-REPORT.md (2026-09-15) REPRODUCED locally: stale `.next`
(post-build) served to `next dev` -> `/_next/static/chunks/*` 404
text/plain -> no hydration -> webpack `.call` failure class. Control run
(deleted `.next` only) 17/17 + 12/12 PASS. Production manifestation:
NOT TESTED. This pass did not re-run browsers (avoid prod-target load).
Status: STATIC REVIEW ONLY + prior FAIL evidence. Previous report remains
unresolved until verified on live deployment. No fix claimed.

## Phase 5 — Auth (STATIC REVIEW ONLY, live BLOCKED)

- Signup `registerAction` (auth.ts): zod (names 1-60, email, pw 8+upper+
digit, match), terms==on, Gmail canonicalize, emailRedirectTo
`/auth/callback?signup=1`, dup maps friendly (STATIC PASS), profile
upsert service-role server-only (STATIC PASS), autoSignIn attempt.
Turnstile env-gated no-op + fail-open on exception (P2). Limit 5/15m
in-memory per-instance (P2 fleet-ineffective). Live valid/dup/weak/
double/refresh: BLOCKED.
- Login `loginAction`: 10/15m in-memory, zod, email_not_confirmed path
else generic bad-credentials, no enumeration (STATIC PASS).
Suspended/banned NOT checked at login (P1 candidate, live review).
- Logout `logoutAction` signOut+redirect; layouts re-getUser per request
(STATIC PASS). Back-after-logout/cookie live: BLOCKED.
- Recovery always-success, no enumeration (STATIC PASS); token live: BLOCKED.

## Phase 6 — Reports (STATIC REVIEW ONLY, live BLOCKED)

- Create (items.ts): Turnstile gate, auth, 10/5m limit + 3-min cooldown,
zod (title 3-120, desc 10-2000, enum category/color, future-date refused,
found sensitive cats REQUIRE distinguishingFeatures), PH bbox clamp,
42703 retry (masks drift, P3). Live invalid/oversize/dup: BLOCKED.
- Edit (my-reports.ts): kind enum, auth, zod, `.eq(reporter_id)` + RLS
(STATIC PASS). Recover API: 401/UUID-404/owner+status gate (STATIC PASS).
DELETE soft-removes own (STATIC PASS). Deleted-visibility: BLOCKED.

## Phase 7 — Storage (STATIC REVIEW ONLY, live abuse BLOCKED)

- POST /api/item-images: 401, multipart 400, enum 400, max 4, types
jpeg/png/webp/gif (SVG out), 5MB/file, owner 403 (STATIC PASS). Path
`<uid>/lost|found_<id>_<ts>_<i>.<ext>`, upsert:false. No magic-byte
check (P1 candidate). DB-fail orphan risk (P2).
- Avatars 4MB uid-folder (STATIC PASS). Policies uid-folder scoped
(STATIC PASS, live NOT TESTED). Service-role server-only (STATIC PASS);
bundle leak NOT TESTED.

## Phase 8 — Search/Discover/Detail (STATIC REVIEW ONLY)

- Discover (query+params): PAGE_SIZE 24, MAX_FEED_PAGES 20, shared
applyFeedFilters rows+counts (STATIC PASS), active-only, invalid->default.
- /api/similar: sanitize + <4 short-circuit + active-only + no-store
(STATIC PASS).
- Detail: maybeSingle+notFound but soft-404 HTTP200 carried F-009 (P3).
Private features in item_private_details owner-RLS (STATIC PASS, live
BLOCKED). GET /api/items/[id] returns distinguishingFeatures to ANY
caller — if legacy column unscrubbed, PRIVATE LEAK (P0 candidate F-010,
live confirm BLOCKED). lat/lng nulled in API (STATIC PASS). Detail
JSON-LD hardened; faq+layout raw (F-005 P3).


## Phase 9 — Claims (STATIC REVIEW ONLY, live BLOCKED)

RPC `verify_ownership_answers` (trust.sql): auth_required,
suspended/banned blocked, 10-fails/30d restricted, owner self-claim out,
5-attempt cap, SHA-256 in-DB compare, pass/fail JSON only (STATIC PASS).
`saveOwnershipChallengeAction` hashes pre-insert, owner eq+RLS
(STATIC PASS). Race/rate live: BLOCKED.

## Phase 10 — Messaging (STATIC REVIEW ONLY, live BLOCKED)

getOrCreate: auth, item-exists, anti-self, bidir-block (STATIC PASS).
sendMessage: auth, trim non-empty, participant+block, sender=uid
(STATIC PASS). getMessages participant-gated; markRead via
`mark_messages_read` RPC (STATIC PASS). Voice validated, 200-msg cap,
preview N+1 (P3). IDOR/rapid/dup live: BLOCKED.

## Phase 11 — Admin (STATIC REVIEW ONLY, live abuse BLOCKED)

AdminLayout + isAdminUser (admin|moderator) on every action; contact-admin
service-role after role verify (STATIC PASS). RLS admin policies on
paper (STATIC PASS, live NOT TESTED). Direct/API/tamper live: BLOCKED.

## Phase 12 — DB (STATIC REVIEW ONLY, live SQL BLOCKED)

Schema+security-migration+hardening reviewed: profiles anon-col-revoked,
lost/found active-or-owner/insert/update/delete-own, admin moderate,
audit append-only, messages participant+own, storage uid-folder, contact
public-insert/admin-select (all STATIC PASS on paper). Per-table live
anon/auth matrix + drift vs live: BLOCKED (prod target). Checklist SQL
NOT executed.

## Phase 13 — API/action ledger (STATIC REVIEW ONLY)

register/login/logout/reset, items create/update, item-images, avatars,
items/[id] GET/DELETE/recover, similar, track, messaging, ownership RPC,
admin, contact, reunite/alerts/settings — all server-check authN/Z per
code (STATIC PASS) except GET /api/items/[id] leak note F-010. Full abuse
matrix (logged-out/A-on-B/tamper/oversize/dup/replay/expired): BLOCKED.

## Phase 14 — Secrets/headers (grep EXECUTED, bundle NOT TESTED)

SERVICE_ROLE in 9 server-only files, none in `use client` per grep
(STATIC PASS; bundle proof NOT TESTED). dangerouslySetInnerHTML in 8
files, detail hardened, faq+layout raw (F-005). console.* in 40 files
(P3). NEXT_PUBLIC only anon/site/verify (STATIC PASS). CSP/HSTS/X-Frame
reviewed statically; live header + WS/tiles: NEEDS MANUAL REVIEW.

## Phase 15-19 — States/mobile/PWA/perf (mixed)

- States files present; no raw stack per comments (STATIC PASS). Live
slow/timeout/empty matrix: NOT TESTED.
- Mobile/a11y: prior 107/107 Playwright PASS carried; axe/SR/motion/map:
NEEDS MANUAL REVIEW.
- Network/concurrency: NOT TESTED (needs staging harness).
- PWA/SEO/legal: manifest v2 SW same-origin never-/api, prod-only
register, sitemap+robots+canonical+OG present (STATIC PASS). SW private
cache: NEEDS MANUAL REVIEW.
- Perf: build 24.1s, shared 103kB, messages/[id] 205kB heaviest.
Lighthouse/N+1-live/dup-req: NOT TESTED (preview N+1 + sitemap5000 P3).

## Critical findings (this pass; F-001..F-009 carried, F-010..F-012 new)

- F-001 (P2, STATIC+prior runtime): `src/middleware.ts:48`
`if (false && isProtected && !user)` disables edge redirect; layouts gate.
Fix: re-enable or delete dead code. Retest: logged-out probe matrix.
- F-001b (P2): `/report/lost|found` render wizard logged-out; submit
rejected server-side (items.ts:109). Fix: auth gate. Retest: logged-out GET.
- F-002 (P1): Supabase target unconfirmed (prod-domain pairing) =>
Phases 5-12 live BLOCKED. Fix: provision staging. Retest: full matrix.
- F-003 (P2): npm audit postcss+sharp highs. Fix: sharp upgrade; Next 16
plan. Retest: `npm audit`.
- F-004 (P3): lint `draft-autosave.tsx:46` deps. Fix: add formId.
- F-005 (P3): raw JSON.stringify faq+layout. Fix: jsonLdStringify.
- F-006 (P3): 2 spec files unloadable (dup titles). Fix: dedupe.
- F-007 (P2): stale `.next` breaks dev (prior repro). Fix: clean script.
- F-008 (P3): no `test` script. Fix: add `playwright test`.
- F-009 (P3): soft-404 item IDs HTTP200 (prior probe). Fix: real 404.
- F-010 (P0 candidate -> confirm live, conservatively P0): GET
`/api/items/[id]` (route.ts) selects `*` incl `distinguishing_features`
and returns it as `distinguishingFeatures` publicly. If 110 scrub ran,
column null (benign); if legacy rows unscrubbed, PRIVATE LEAK. Evidence:
static code excerpt above. Fix: drop column from select + gate private
read to owner/participant; live-verify scrub. Retest: anon GET on seeded
legacy row on staging.
- F-011 (P1): no server magic-byte check on item-images/avatars (MIME
client-controlled) + SVG already rejected by allowlist (STATIC PASS on
SVG). Fix: server sniff + reject non-image. Retest: polyglot upload.
- F-012 (P1): rate-limit in-memory per-instance (`lib/rate-limit.ts`) +
Turnstile unconfigured/fail-open. Fix: Turnstile keys + persistent store
or Supabase caps. Retest: fleet + brute-force harness.

## Verified passes (EXECUTED this pass only)

- typecheck exit 0; lint exit 0 (+1 warning); build exit 0 (24.1s, 35/35
pages, shared 103kB, middleware 94.2kB). Prior-pass browser suites
(17/17, 6/6, 6/6, 107/107) cited as prior evidence, NOT fresh PASS.

## Failed tests

- `npm audit --omit=dev` exit 1 (F-003 P2). No other executed command
failed this pass.

## Blocked / Not tested

- BLOCKED (prod target): all auth/report/storage/search/claim/message/
admin/RLS live abuse, concurrency, forms.spec (real email), checklist SQL.
- NOT TESTED: npm ci, prod snag manifestation, bundle secret scan,
Lighthouse, live CSP headers, SW device behavior, axe/SR live.
- NEEDS MANUAL REVIEW: Vercel cache, live headers/WS/tiles, map a11y,
SW private-data, suspended/banned login path.

## Appendix pointers (full row-level files in repo)

- File census: Phase 1 counts + route/action/API/DB inventories above;
every file STATIC REVIEW ONLY except build/lint/typecheck/audit-grep
EXECUTED. Button-by-button live clicks: NOT TESTED (needs staging).
- Function ledger: Phase 13 table. RLS appendix: Phase 12 policy list;
each policy STATIC REVIEW ONLY, live result BLOCKED.
- Prior AUDIT-REPORT.md holds line-level probe evidence for Phases 0-4.

## Ordered fix queue

1. F-010 confirm/scrub private leak (P0). 2. F-002 staging + F-011 upload
sniff + F-012 limits/Turnstile + suspended-login review (P1). 3. F-001/
F-001b gates, F-003 sharp, F-007 clean (P2). 4. F-004/5/6/8/9 (P3).

## Final decision

```text
NOT READY — P0 ISSUES REMAIN
```

F-010 is conservatively P0 until live scrub/inline-gate proof on an
isolated target. Even if F-010 clears, F-002/F-011/F-012 keep P1s open.

## What was tested vs inspected vs still needs humans

- EXECUTED: git baseline, env-key presence (no values), versions,
typecheck, lint, build, npm audit, secret/dangerous/console grep,
full static read of middleware/actions/API/validation/discover/RLS.
- STATIC REVIEW ONLY: all pages/layouts/actions/API/RLS/storage/claims/
messaging/admin/search/PWA/SEO/legal (no runtime claim).
- NEEDS live/staging + humans: Phases 5-12 abuse, concurrency,
Lighthouse, bundle scan, prod snag, headers/WS/tiles, axe/SR, SW device,
suspended/banned paths, deleted-ID visibility, email flows.

