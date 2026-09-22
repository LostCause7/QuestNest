import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Server-side Supabase client for Server Components, Server Actions and
 * Route Handlers. A new client must be created per request because it reads
 * the request cookies.
 */
export async function createClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Add them in Vercel → Settings → Environment Variables (Production)."
    );
  }
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.url,
    env.key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component: cookies cannot be written here.
            // The proxy refreshes sessions, so this can be safely ignored.
          }
        },
      },
    }
  );
}

/** Returns the verified auth claims for the current request, or null. */
export async function getClaims() {
  if (!getSupabaseEnv()) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    return data?.claims ?? null;
  } catch {
    return null;
  }
}
