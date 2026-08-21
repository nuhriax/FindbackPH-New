# FindBack PH — Phase 1-3

Lost & Found platform for the Philippines. This build covers **Phase 1 (audit — N/A, new project), Phase 2 (architecture), and Phase 3 (core functionality)**: real authentication, profiles, lost/found item reports with database persistence, search/filtering, and a user dashboard.

Not yet built (Phase 4+, per the phased plan): matching engine, messaging, notifications, saved items, moderation/reporting, admin dashboard, image uploads. Contact buttons on item pages are visibly disabled rather than faked, since messaging isn't wired up yet.

## What's real here

- Registration/login/logout via Supabase Auth, with a database trigger that creates a `profiles` row on signup.
- Row Level Security on every table — a user can only edit/delete their own reports; enforced in Postgres, not just in the UI.
- Lost/found item creation writes directly to Postgres via Server Actions, with Zod validation on the server (not just the client).
- Full-text search (Postgres `tsvector`) and category/city filters on both listing pages.
- Dashboard reads the signed-in user's actual reports from the database.
- Middleware protects `/dashboard`, `/report`, `/messages`, `/settings`, `/admin` — redirects unauthenticated users to `/login`. `/admin` additionally checks `role` in the database (not just middleware — re-checked wherever an admin action would eventually live).

## Setup

### 1. Supabase project
1. Create a project at supabase.com (region: Singapore, closest to PH).
2. In **SQL Editor**, paste and run the entire contents of `supabase/schema.sql`.
3. In **Storage**, create a public bucket named `item-images` (used starting in the image-upload phase).
4. In **Storage**, create a public bucket named `avatars` (used for profile photos). New users can only upload their own photo, so add an RLS/storage policy that allows `INSERT` and `UPDATE` on objects in `avatars` for `auth.uid()` and public `SELECT` (so photos render everywhere). Example policies:
   - `SELECT` → `bucket_id = 'avatars'` (public read)
   - `INSERT` → `bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text`
   - `UPDATE`/`DELETE` → `bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text`
5. Copy your keys from **Project Settings → API**.

### 2. Environment variables
```bash
cp .env.example .env.local
```
Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # server-only, never exposed to the client
```

### 3. Install and run
```bash
npm install
npm run dev
```
Visit http://localhost:3000.

### 4. Verify the chain end-to-end
- Register an account → check **Table Editor → profiles** in Supabase, confirm a row appeared.
- Report a lost item → check **lost_items** table for the new row.
- Log out, visit `/lost` in an incognito window → confirm the item is publicly visible.
- Try visiting `/dashboard` while logged out → should redirect to `/login`.

### 5. Before deploying
```bash
npm run lint
npm run typecheck
npm run build
```
Fix anything that surfaces — this hasn't been run in this environment (no network access here), so treat it as the first real checkpoint.

## Deploy to Vercel
1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the three environment variables from `.env.local` in **Project Settings → Environment Variables**.
4. Deploy. Supabase requires no extra config for Vercel — it's just an HTTPS API.

## Next phases
Phase 4 (matching, messaging, notifications, saved items, moderation) and Phase 5 (admin dashboard) build on this schema — `matches`, `conversations`, `messages`, `notifications`, `reports`, and `audit_logs` tables aren't created yet. Say the word and I'll extend `schema.sql` and the app for those next.
