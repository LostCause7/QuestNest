# QuestNest

Chores become quests. Kids actually want to do them.

QuestNest is a web app for families: parents create quests (chores) and a reward shop, kids pick their avatar, enter a PIN, complete quests, earn a custom currency, keep streaks, unlock badges, and spend their points on rewards the parents define.

- **Parent HQ** (`/app`): dashboard with approval queue, kid management, quests, rewards, activity ledger, settings.
- **Kid Mode** (`/kids`): Netflix-style profile picker + PIN pad, today's quests, shop, trophy room.
- **Marketing site** (`/`).

## Stack

Next.js 16 (App Router) - React 19 - Tailwind CSS 4 - shadcn/ui - Framer Motion - Supabase (Postgres, Auth, Realtime)

## Getting started

1. Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) once (runs the SQL, enables Email + Google login).
2. `npm install`
3. `npm run dev` and open http://localhost:3000

Environment variables live in `.env.local` (see `.env.example`).

## Project layout

```
app/
  (marketing)/           landing page
  (auth)/                login, signup, forgot/reset password
  auth/callback          OAuth + email-link code exchange
  onboarding/            first-run wizard
  (parent)/app/          Parent HQ
  (kid)/kids/            Kid Mode
components/              ui (shadcn), brand, parent, kid
lib/
  supabase/              browser + server clients, proxy helper
  actions/               server actions (all mutations)
  levels.ts badges.ts templates.ts schedule.ts avatars.ts
supabase/migrations/     SQL schema (paste into the SQL Editor)
types/database.ts        typed schema for supabase-js
proxy.ts                 session refresh + route protection
```

## Deploy

**Option A - Vercel CLI (fastest):**

```bash
npx vercel login          # one-time, opens the browser
npx vercel                # creates the project and a preview deploy
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
npx vercel env add NEXT_PUBLIC_SITE_URL production   # https://your-app.vercel.app
npx vercel --prod
```

**Option B - Git import:** push to GitHub and import at [vercel.com/new](https://vercel.com/new). Add the three env vars from `.env.example` and deploy.

**After the first production deploy**, register the URL in Supabase:

1. **Authentication > URL Configuration** - set *Site URL* to `https://your-app.vercel.app` and add `https://your-app.vercel.app/auth/callback` (plus `https://*-your-team.vercel.app/auth/callback` for previews) to *Redirect URLs*.
2. If Google sign-in is enabled, add the same origin to the Google OAuth client's **Authorized JavaScript origins**.

`next build` passes with zero type or lint errors, so Vercel's default Next.js settings work without changes.
