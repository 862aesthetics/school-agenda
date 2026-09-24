# School Agenda

A multi-user school productivity PWA — schedule, assignments, calendar, grades, and notes. Built with React + TypeScript + Vite, Supabase (auth, database, storage, realtime), and deployed on Netlify.

## How the schedule model works

This is the part of the app that isn't a generic calendar, so it's worth understanding before you configure anything:

- **Periods are permanent.** Each period (Period 1, Period 2, ...) is one class/teacher/room for the entire school year.
- **Blocks rotate.** A normal day is Block 1, 2, 3, Lunch, 4, 5, 6. A **Day 1–4 template** says which period fills each block. Block 3 might be Period 4 on Day 1 and Period 2 on Day 2 — the day templates store `block → period`, never a class name directly.
- **Rotation** runs Day 4 → Day 3 → Day 2 → Day 1 → repeat, skipping weekends. You give it one reference date + day, and every other date is calculated automatically (`src/utils/rotation.ts` — this file has no UI dependencies and is worth reading first if you want to verify the logic yourself).
- **All Periods Meet** is a *completely separate* schedule (its own times, not derived from Day 1–4) that you can apply to a specific date as an override.
- **Date overrides** (a specific date forced to Day 2, All Periods Meet, or No School) affect only that date — the underlying rotation isn't shifted for dates afterward.

## Two judgment calls worth knowing about

1. **Setup starts blank, on purpose.** The spec's sample schedule (Film Studies, Biology for Allied Health E, etc.) was used to validate the data model — it proves periods can hold multi-teacher strings and split-semester names as plain text — but it was **not** hard-coded into the app. The app is multi-user, and baking one person's real class list into the source as a "default" would contradict that. You'll enter your own schedule through the guided setup wizard.
2. **Periods are referenced by stable ID, not position.** Day templates point at a period's UUID, not its "Period N" slot. Reordering periods is instant with no confirmation dialog, because it only changes display numbering — it can never silently repoint a schedule block at a different class the way a position-based reference could.

## Tech stack

- **Frontend:** React 19 + TypeScript, Vite, Tailwind CSS v4
- **Auth / DB / Storage / Realtime:** Supabase
- **Offline:** IndexedDB cache + mutation outbox (`src/lib/offline`), replayed automatically on reconnect, last-write-wins
- **PWA:** `vite-plugin-pwa` (installable, offline app-shell caching, autoupdate)
- **Hosting:** Netlify

## Project structure

```
src/
  components/     UI building blocks, grouped by feature (schedule/, calendar/, setup/, ui/...)
  hooks/          useSupabaseTable (generic offline+realtime data hook), useScheduleContext
  lib/            Supabase client, offline cache + sync queue
  pages/          One file per route
  store/          Zustand: auth, profile/school-year, sync status
  types/          Hand-written types mirroring the database schema
  utils/          rotation.ts (the rotation engine), schedule.ts, format.ts
supabase/
  migrations/0001_init.sql   Full schema, RLS policies, triggers, storage bucket
```

## 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor**, paste the contents of `supabase/migrations/0001_init.sql`, and run it. This creates every table, index, trigger, RLS policy, the `avatars` storage bucket, and two functions:
   - `handle_new_user()` — auto-creates a blank profile row when someone signs up
   - `delete_user_account()` — lets a signed-in user delete their own account (Settings → Account & Security calls this via RPC); deleting the `auth.users` row cascades through every table above automatically
3. Go to **Authentication → URL Configuration** and set:
   - **Site URL** to your Netlify URL (e.g. `https://your-app.netlify.app`)
   - Add `https://your-app.netlify.app/reset-password` to **Redirect URLs** (needed for the "forgot password" email link)
4. Email confirmations are on by default. If you'd rather skip email verification during testing, turn off **Confirm email** under **Authentication → Providers → Email**.
5. Copy your **Project URL** and **anon/public key** from **Settings → API** — you'll need them next.

## 2. Local development

```bash
npm install
cp .env.example .env   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

## 3. Deploy to Netlify

1. Push this project to a Git repo and connect it in Netlify (or drag-and-drop the `dist/` folder after running `npm run build` for a one-off deploy).
2. Netlify reads `netlify.toml` automatically — build command and SPA redirect are already configured.
3. In **Site settings → Environment variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Once it's live, go back to Supabase's Auth URL settings (step 1.3) and make sure they point at your real Netlify URL.

That's it — the app is ready to use. Each person who signs up gets their own account, profile, schedule, and school-year data, isolated by Row Level Security.

## Notes on scope / good next steps

A few things were deliberately kept simple given the size of this build — flagged here rather than silently shipped:

- **Offline sync** replays queued writes in order on reconnect (last-write-wins). It's solid for typical short disconnections; it doesn't do field-level merge conflict resolution if the *same* row was edited on two offline devices at once.
- **Notes** store simple HTML from a lightweight `contentEditable` toolbar (bold/italic/heading/lists/links) — there's no markdown import/export or a heavier editor library, matching the spec's "basic formatting, text only" scope.
- **Archived school years** are viewable read-only from Settings → School Years, currently showing that year's class list. Extending this to a full read-only Dashboard/Assignments/Grades view for an archived year is a natural next step if you want deeper history browsing.
- **Bundle size**: the production JS bundle is ~177KB gzipped as a single chunk. Route-based code-splitting (`React.lazy`) would trim initial load time further if that becomes a priority.
- Grade values are stored as free text so you can use whatever scale your school uses; the Final Grade average only computes when all four marking periods look numeric.
