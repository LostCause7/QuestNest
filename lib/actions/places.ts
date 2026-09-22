"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireFamily } from "@/lib/data/family";
import { fetchNearbyPage, geocodeCityState, NEARBY_PAGE_SIZE, type NearbyPage } from "@/lib/places";
import { ok, fail, friendlyError, guardAction, type ActionResult } from "./result";

export async function suggestNearbyRewards(input?: { page?: number }): Promise<ActionResult<NearbyPage>> {
  return guardAction(async () => {
    const family = await requireFamily();
    const page = Math.max(1, Math.floor(input?.page ?? 1));
    const city = family.location_city?.trim();
    const state = family.location_state?.trim();
    if (!city || !state) {
      return fail("Set your city and state in Settings first, then try Nearby places again.");
    }

    let lat = family.location_lat;
    let lng = family.location_lng;
    if (lat == null || lng == null) {
      const geo = await geocodeCityState(city, state);
      lat = geo.lat;
      lng = geo.lng;
      const supabase = await createClient();
      const { error } = await supabase
        .from("families")
        .update({ location_lat: lat, location_lng: lng })
        .eq("id", family.id);
      if (error && !/column|schema cache|does not exist/i.test(error.message)) {
        /* ignore — lookup still works */
      }
    }

    const result = await fetchNearbyPage(lat, lng, family.location_radius_miles ?? 30, page, NEARBY_PAGE_SIZE);
    return ok(result);
  });
}

const addSchema = z.object({
  places: z
    .array(
      z.object({
        key: z.string().min(1).max(80),
        title: z.string().trim().min(1).max(80),
        description: z.string().max(400),
        icon: z.string().min(1).max(8),
        cost: z.number().int().min(0).max(100000),
        category: z.enum(["privilege", "item", "experience"]),
      })
    )
    .min(1)
    .max(80),
  child_ids: z.array(z.uuid()).min(1, "Pick at least one kid."),
});

export async function addNearbyRewards(input: z.infer<typeof addSchema>): Promise<ActionResult<{ added: number }>> {
  return guardAction(async () => {
    const parsed = addSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid selection.");
    const family = await requireFamily();
    const supabase = await createClient();

    const existing = await supabase.from("rewards").select("source_key").eq("family_id", family.id);
    const have = new Set((existing.data ?? []).map((r) => r.source_key).filter(Boolean));
    const fresh = parsed.data.places.filter((p) => !have.has(p.key));
    if (!fresh.length) return fail("Those places are already in the shop.");

    const rowsToInsert = fresh.map((p) => ({
      family_id: family.id,
      title: p.title,
      description: p.description,
      icon: p.icon,
      cost: p.cost,
      category: p.category,
      requires_approval: true,
      source_key: p.key,
    }));
    let { data: rows, error } = await supabase.from("rewards").insert(rowsToInsert).select("id");
    if (error && /column|schema cache|does not exist/i.test(error.message)) {
      const retry = await supabase
        .from("rewards")
        .insert(
          fresh.map((p) => ({
            family_id: family.id,
            title: p.title,
            description: p.description,
            icon: p.icon,
            cost: p.cost,
            category: p.category,
            requires_approval: true,
          }))
        )
        .select("id");
      rows = retry.data;
      error = retry.error;
    }
    if (error || !rows) return fail(friendlyError(error?.message ?? "Could not add those rewards."));

    const { error: asgErr } = await supabase.from("reward_assignments").insert(
      rows.flatMap((r) => parsed.data.child_ids.map((child_id) => ({ reward_id: r.id, child_id })))
    );
    if (asgErr && !/does not exist|schema cache/i.test(asgErr.message)) return fail(friendlyError(asgErr.message));

    revalidatePath("/app", "layout");
    revalidatePath("/kids", "layout");
    return ok({ added: rows.length }, `Added ${rows.length} nearby reward${rows.length === 1 ? "" : "s"} to the shop.`);
  });
}
