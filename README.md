# FindBack PH

Lost & Found platform for the Philippines — **live at [findbackph.me](https://findbackph.me)**.

A community-powered Next.js app where people report lost belongings, report items they've found, get automatic match suggestions, and coordinate safe returns through in-app messaging.

## What's built

- **Auth** — Supabase Auth (email/password + Google/Facebook OAuth), profile auto-creation via DB trigger, password reset, complete-profile flow
- **Reports** — lost/found item reports with photo uploads (Supabase Storage), categories, locations, rewards, editing, and recover/resolution flow
- **Search** — Postgres full-text search (`tsvector`) + fuzzy matching (`pg_trgm`), category/city/date/photo filters, sort options
- **Matching engine** — scored cross-referencing of lost ↔ found reports (`matches` table), with dedupe-safe notifications via `notify_user_once`
- **Messaging** — per-item conversations between reporters, block users, safety reminders
- **Notifications** — in-app notification center + unread badge
- **Trust & safety** — email-verified badges, trusted-member signals, ownership verification challenges before handover details are revealed
- **Moderation** — user flags, item abuse reports, blocked users, admin/moderator dashboard with role checks enforced in RLS *and* re-checked server-side
- **Security** — Row Level Security on every table, middleware route protection, Zod validation on the server, signed image URLs

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Supabase (Postgres, Auth, Storage) · Vercel

## Setup

### 1. Supabase project
1. Create a project at supabase.com (region: Singapore, closest to PH).
2. In **SQL Editor**, paste and run the entire contents of `supabase/schema.sql`.
3. In **Storage**, create public buckets `item-images` and `avatars`. Add storage policies so users can write only to their own `auth.uid()` folder in `avatars` and everyone can read:
   - `SELECT` → `bucket_id = 'avatars'` (public read)
   - `INSERT`/`UPDATE` → `(storage.foldername(name))[1] = auth.uid()::text`
4. Copy your keys from **Project Settings → API**.

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
Fix anything that surfaces before deploying.

## Deploy to Vercel

The site deploys to Vercel (project: `findback-ph`, production domain: **findbackph.me**). Pushes to `main` trigger production deployments automatically. Set the environment variables from `.env.example` in **Project Settings → Environment Variables**. Supabase requires no extra config for Vercel — it's just an HTTPS API.

## Repository

https://github.com/nuhriax/FindbackPH-New
