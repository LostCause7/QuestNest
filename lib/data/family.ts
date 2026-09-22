import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient, getClaims } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Family } from "@/types/database";

export type CurrentUser = { id: string; email: string | null };

/** Verified user for the current request, or redirect to /login. */
export const requireUser = cache(async (): Promise<CurrentUser> => {
  const claims = await getClaims();
  if (!claims?.sub) redirect("/login");
  return { id: claims.sub, email: (claims.email as string | undefined) ?? null };
});

/** The family the signed-in user belongs to, or null. */
export const getFamily = cache(async (): Promise<Family | null> => {
  if (!getSupabaseEnv()) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("families")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
});

/** Family or redirect to onboarding. */
export async function requireFamily(): Promise<Family> {
  await requireUser();
  const family = await getFamily();
  if (!family) redirect("/onboarding");
  return family;
}
