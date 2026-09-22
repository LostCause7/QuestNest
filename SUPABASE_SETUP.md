# QuestNest - Supabase setup (one time, ~10 minutes)

Project: `kpvkgffjiihaihwkzrxq` (https://supabase.com/dashboard/project/kpvkgffjiihaihwkzrxq)

## 1. Create the database schema

1. Open **SQL Editor** in the Supabase dashboard and click **New query**.
2. Paste the entire contents of [`supabase/migrations/0001_questnest_init.sql`](supabase/migrations/0001_questnest_init.sql).
3. Click **Run**. You should see "Success. No rows returned".

The script creates every table, trigger, RLS policy and RPC the app uses, and enables Realtime on the tables the UI subscribes to. It is safe to run exactly once on a fresh project.

If this project already has the first migration, run any later files you have not run yet, in order:

- [`0002_fix_family_insert_rls.sql`](supabase/migrations/0002_fix_family_insert_rls.sql)
- [`0003_cast_enum_case.sql`](supabase/migrations/0003_cast_enum_case.sql)
- [`0004_resubmit_rejected_chore.sql`](supabase/migrations/0004_resubmit_rejected_chore.sql)
- [`0005_location_and_shop.sql`](supabase/migrations/0005_location_and_shop.sql) — city/state shop radius and per-kid rewards
- [`0006_cast_adjust_points.sql`](supabase/migrations/0006_cast_adjust_points.sql) — bonus/deduct enum cast
- [`0007_milestones_and_style.sql`](supabase/migrations/0007_milestones_and_style.sql) — lifetime unlocks, kid/parent looks, custom nest milestones
- [`0008_parent_profiles.sql`](supabase/migrations/0008_parent_profiles.sql) — extra parent faces on the picker, each with their own PIN

The app still runs if a later file is missing (nearby shop, custom unlocks, extra parent faces, and extra look fields degrade instead of crashing). Run them in order when you can.

## 2. Email + password sign-in

**Authentication > Sign In / Providers > Email**: leave enabled.

- "Confirm email" ON (default) means parents must click a link before their first login. The app handles this flow.
- For faster local testing you can turn "Confirm email" OFF, then turn it back on before launch.

## 3. Redirect URLs

**Authentication > URL Configuration**

- **Site URL**: `http://localhost:3000` (change to your Vercel URL after deploying)
- **Redirect URLs** (add each):
  - `http://localhost:3000/**`
  - `https://<your-app>.vercel.app/**` (after deploying)

## 4. API key

`.env.local` is already pointed at this project URL and the `sb_publishable_...` key.

## 5. Run the app

```bash
npm install
npm run dev
```

Open http://localhost:3000, click **Get started**, and create your parent account.
