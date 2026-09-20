import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Family } from "@/types/database";

export type CurrentUser = { id: string; email: string | null };

/** Verified user for the current request, or redirect to /login. */
export const requireUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/login");
  return { id: claims.sub, email: (claims.email as string | undefined) ?? null };
});

/** The family the signed-in user belongs to, or null. */
export const getFamily = cache(async (): Promise<Family | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("families")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data ?? null;
});

/** Family or redirect to onboarding. */
export async function requireFamily(): Promise<Family> {
  await requireUser();
  const family = await getFamily();
  if (!family) redirect("/onboarding");
  return family;
}
