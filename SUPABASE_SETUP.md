# QuestNest - Supabase setup (one time, ~10 minutes)

Project: `lxjydhkmjpdqqycfiqbs` (https://supabase.com/dashboard/project/lxjydhkmjpdqqycfiqbs)

## 1. Create the database schema

1. Open **SQL Editor** in the Supabase dashboard and click **New query**.
2. Paste the entire contents of [`supabase/migrations/0001_questnest_init.sql`](supabase/migrations/0001_questnest_init.sql).
3. Click **Run**. You should see "Success. No rows returned".

The script creates every table, trigger, RLS policy and RPC the app uses, and enables Realtime on the tables the UI subscribes to. It is safe to run exactly once on a fresh project.

## 2. Email + password sign-in

**Authentication > Sign In / Providers > Email**: leave enabled.

- "Confirm email" ON (default) means parents must click a link before their first login. The app handles this flow.
- For faster local testing you can turn "Confirm email" OFF, then turn it back on before launch.

## 3. Google sign-in

1. Go to the [Google Cloud Console - OAuth clients](https://console.cloud.google.com/auth/clients) and create an **OAuth client ID** of type **Web application**.
   - If prompted, configure the consent screen first (External, app name "QuestNest", your support email).
2. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - your production URL later, e.g. `https://questnest.vercel.app`
3. **Authorized redirect URIs**:
   - `https://lxjydhkmjpdqqycfiqbs.supabase.co/auth/v1/callback`
4. Click **Create**, copy the **Client ID** and **Client Secret**.
5. In Supabase: **Authentication > Sign In / Providers > Google** -> enable, paste Client ID + Secret, save.

## 4. Redirect URLs

**Authentication > URL Configuration**

- **Site URL**: `http://localhost:3000` (change to your Vercel URL after deploying)
- **Redirect URLs** (add each):
  - `http://localhost:3000/**`
  - `https://<your-app>.vercel.app/**` (after deploying)

## 5. API key

`.env.local` is already filled with your project URL and the legacy `anon` key, which works today.
Supabase is retiring `anon` keys at the end of 2026; when convenient, copy the `sb_publishable_...` key from
**Settings > API Keys** and paste it over `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. No code changes are needed.

## 6. Run the app

```bash
npm install
npm run dev
```

Open http://localhost:3000, click **Get started**, and create your parent account.
