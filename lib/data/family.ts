import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient, getClaims } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { clearKidNotices, settleMandatoryPenalties } from "@/lib/data/parent";
import type { Family } from "@/types/database";

export type CurrentUser = { id: string; email: string | null };

/** Verified user for the current request, or redirect to /login. */
export const requireUser = cache(async (): Promise<CurrentUser> => {
  const claims = await getClaims();
  if (!claims?.sub) redirect("/login");
  return { id: claims.sub, email: (claims.email as string | undefined) ?? null };
});

const MISSING_RPC = /could not find|schema cache|does not exist/i;

function asFamily(data: Family): Family {
  return {
    ...data,
    location_city: data.location_city ?? null,
    location_state: data.location_state ?? null,
    location_lat: data.location_lat ?? null,
    location_lng: data.location_lng ?? null,
    location_radius_miles: data.location_radius_miles ?? 30,
  };
}

function nestLoadError(message: string) {
  return new Error(
    `Couldn't load your nest (${message}). If you just ran SQL, run 0031_tx_kind_text_cast.sql in Supabase, then sign in again. Don't create a second nest.`
  );
}

const FAMILY_CORE =
  "id, name, owner_id, currency_name, currency_emoji, timezone, created_at";

/** The family the signed-in user belongs to, or null if they truly have none. Query errors throw. */
export const getFamily = cache(async (): Promise<Family | null> => {
  if (!getSupabaseEnv()) {
    throw new Error("ChoreHall could not reach the nest. Check that Supabase is connected.");
  }
  const supabase = await createClient();
  const queried = await supabase
    .from("families")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (queried.data) return asFamily(queried.data);

  if (queried.error) {
    const slim = await supabase
      .from("families")
      .select(FAMILY_CORE)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (slim.data) return asFamily(slim.data as Family);
  }

  const rpc = await supabase.rpc("my_family");
  if (rpc.data) return asFamily(rpc.data);
  if (queried.error) throw nestLoadError(queried.error.message);
  if (rpc.error && !MISSING_RPC.test(rpc.error.message)) throw nestLoadError(rpc.error.message);
  return null;
});

/** Family or redirect to onboarding. */
export async function requireFamily(): Promise<Family> {
  await requireUser();
  const family = await getFamily();
  if (!family) redirect("/onboarding");
  try {
    await settleMandatoryPenalties(family);
    await clearKidNotices(family);
  } catch (error) {
    console.error(error);
  }
  return family;
}
