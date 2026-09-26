import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabaseEnv } from "@/lib/supabase/env";

/** Service-role client for Stripe webhooks. Null if the key is not set. */
export function createAdminClient() {
  const env = getSupabaseEnv();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!env || !service) return null;
  return createClient<Database>(env.url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
