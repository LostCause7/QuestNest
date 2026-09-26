# ChoreHall - Supabase setup (one time, ~10 minutes)

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
- [`0009_fun_and_rewards.sql`](supabase/migrations/0009_fun_and_rewards.sql) — family look (crest, default room, sky, locked slots), bonus rules (daily / combo / mystery / perfect-day points), kindness quests, reward rarity, kudos notes, gifted looks, season-pass claims, daily awards, and the new trophies that go with them
- [`0010_single_claim.sql`](supabase/migrations/0010_single_claim.sql) — optional “only one kid can claim this” quests (first Done tap of the day keeps it)
- [`0011_mandatory_chores.sql`](supabase/migrations/0011_mandatory_chores.sql) — optional mandatory quests: miss a due day and the assigned kid loses that quest’s points (a single-claim quest is safe for everyone if anyone claimed it)
- [`0012_skip_requests.sql`](supabase/migrations/0012_skip_requests.sql) — kids can ask to skip a quest today; a parent confirms; confirmed (or still-pending) skips award no points and skip the mandatory deduction
- [`0013_cash_redeem_and_cancel.sql`](supabase/migrations/0013_cash_redeem_and_cancel.sql) — cash rewards (name or details contain $) let kids pick a $5-step amount; they can change their mind on a pending or approved redemption and get the points back
- [`0022_family_subscription.sql`](supabase/migrations/0022_family_subscription.sql) — one Stripe subscription per nest, covering every parent and kid on that account

The app still runs if a later file is missing (nearby shop, custom unlocks, extra parent faces, extra look fields, kudos, gifted looks, bonus rules, daily awards, one-kid-claim quests, mandatory deductions, cash amounts, and change-mind refunds degrade instead of crashing — the related settings just show a hint to run the migration). Run them in order when you can.

## 2. Email + password sign-in

**Authentication > Sign In / Providers > Email**: leave enabled.

- "Confirm email" ON (default) means parents must click a link before their first login. The app handles this flow.
- For faster local testing you can turn "Confirm email" OFF, then turn it back on before launch.

## 3. Redirect URLs

**Authentication > URL Configuration**

Confirmation emails use Site URL when the requested redirect is not on this list. If Site URL is a `*.vercel.app` address, families land on Vercel instead of finishing setup.

- **Site URL**: `https://chorehall.net`
- **Redirect URLs** (add each):
  - `https://chorehall.net/**`
  - `https://www.chorehall.net/**`
  - `http://localhost:3000/**`
  - `https://*-*.vercel.app/**` (preview deploys only)

## 4. API key

`.env.local` is already pointed at this project URL and the `sb_publishable_...` key.

## 5. Run the app

```bash
npm install
npm run dev
```

Open http://localhost:3000, click **Get started**, and create your parent account.
