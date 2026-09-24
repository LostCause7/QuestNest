"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireFamily } from "@/lib/data/family";
import { ok, fail, friendlyError, guardAction, type ActionResult } from "./result";
import type { FamilyStyle } from "@/types/database";

const settingsSchema = z.object({
  name: z.string().trim().min(1, "Family name is required.").max(60),
  currency_name: z.string().trim().min(1, "Currency name is required.").max(20),
  currency_emoji: z.string().trim().min(1, "Pick an emoji.").max(8),
  timezone: z.string().trim().min(1).max(64),
  location_city: z.string().trim().max(80).optional().nullable(),
  location_state: z.string().trim().max(40).optional().nullable(),
  location_radius_miles: z.number().int().min(5).max(100).optional(),
});

export type FamilySettingsInput = z.infer<typeof settingsSchema>;

export async function updateFamilySettings(input: FamilySettingsInput): Promise<ActionResult> {
  return guardAction(async () => {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  const family = await requireFamily();
  const supabase = await createClient();
  const city = parsed.data.location_city?.trim() || null;
  const state = parsed.data.location_state?.trim() || null;
  const radius = parsed.data.location_radius_miles ?? family.location_radius_miles ?? 30;

  let lat = family.location_lat;
  let lng = family.location_lng;
  if (city && state) {
    const moved = city !== family.location_city || state !== family.location_state || family.location_lat == null;
    if (moved) {
      try {
        const { geocodeCityState } = await import("@/lib/places");
        const geo = await geocodeCityState(city, state);
        lat = geo.lat;
        lng = geo.lng;
      } catch (e) {
        return fail(e instanceof Error ? e.message : "Could not find that city.");
      }
    }
  } else {
    lat = null;
    lng = null;
  }

  const core = {
    name: parsed.data.name,
    currency_name: parsed.data.currency_name,
    currency_emoji: parsed.data.currency_emoji,
    timezone: parsed.data.timezone,
  };
  const withLocation = {
    ...core,
    location_city: city,
    location_state: state,
    location_lat: lat,
    location_lng: lng,
    location_radius_miles: radius,
  };
  let { error } = await supabase.from("families").update(withLocation).eq("id", family.id);
  if (error && /column|schema cache|does not exist/i.test(error.message)) {
    const retry = await supabase.from("families").update(core).eq("id", family.id);
    error = retry.error;
    if (!error) {
      revalidatePath("/app", "layout");
      revalidatePath("/kids", "layout");
      return ok(undefined, "Settings saved. Nearby shop needs the latest nest update.");
    }
  }
  if (error) return fail(friendlyError(error.message));
  revalidatePath("/app", "layout");
  revalidatePath("/kids", "layout");
  return ok(undefined, city ? `Settings saved. Shop area is ${radius} miles around ${city}.` : "Settings saved.");
  });
}

const familyStyleSchema = z.object({
  room: z.string().trim().max(32).nullable().optional(),
  sky: z.enum(["clear", "rainy", "snowy"]).nullable().optional(),
  seasonalStickers: z.boolean().optional(),
  lockedSlots: z.array(z.string().max(32)).max(20).optional(),
  crestEmoji: z.string().trim().max(16).nullable().optional(),
  crestColor: z.string().trim().max(32).nullable().optional(),
});

export type FamilyStyleInput = z.infer<typeof familyStyleSchema>;

/** Family-wide look: room override, seasonal stickers, locked slots, crest. Needs 0009. */
export async function updateFamilyStyle(input: FamilyStyleInput): Promise<ActionResult> {
  return guardAction(async () => {
    const parsed = familyStyleSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
    const family = await requireFamily();
    const supabase = await createClient();
    const { findItem } = await import("@/lib/cosmetics");
    const style: FamilyStyle = { ...(family.style ?? {}), ...parsed.data };
    if (style.room && !findItem("room", style.room)) style.room = null;
    if (style.lockedSlots) style.lockedSlots = [...new Set(style.lockedSlots)];
    const { error } = await supabase.from("families").update({ style }).eq("id", family.id);
    if (error) {
      if (/column|schema cache|does not exist/i.test(error.message)) return fail("Family looks need the latest nest update (0009).");
      return fail(friendlyError(error.message));
    }
    revalidatePath("/app", "layout");
    revalidatePath("/kids", "layout");
    return ok(undefined, "Nest look saved.");
  });
}

const bonusSchema = z.object({
  daily_bonus_points: z.number().int().min(0).max(1000),
  combo_bonus_points: z.number().int().min(0).max(1000),
  surprise_chance: z.number().int().min(0).max(100),
  perfect_day_points: z.number().int().min(0).max(1000),
});

export type FamilyBonusInput = z.infer<typeof bonusSchema>;

/** Bonus loops: first-of-day, combo, surprise roll, perfect day. 0 = off. Needs 0009. */
export async function updateFamilyBonuses(input: FamilyBonusInput): Promise<ActionResult> {
  return guardAction(async () => {
    const parsed = bonusSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
    const family = await requireFamily();
    const supabase = await createClient();
    const { error } = await supabase.from("families").update(parsed.data).eq("id", family.id);
    if (error) {
      if (/column|schema cache|does not exist/i.test(error.message)) return fail("Bonus rules need the latest nest update (0009).");
      return fail(friendlyError(error.message));
    }
    revalidatePath("/app", "layout");
    revalidatePath("/kids", "layout");
    return ok(undefined, "Bonus rules saved.");
  });
}

export async function setParentPin(pin: string): Promise<ActionResult> {
  const parsed = z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits.").safeParse(pin);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid PIN.");
  const family = await requireFamily();
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_parent_pin", { p_family: family.id, p_pin: parsed.data });
  if (error) return fail(friendlyError(error.message));
  revalidatePath("/app/settings");
  return ok(undefined, "Parent PIN saved.");
}

export async function updateProfileName(name: string): Promise<ActionResult> {
  const parsed = z.string().trim().min(1, "Name is required.").max(60).safeParse(name);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid name.");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const uid = data?.claims.sub;
  if (!uid) return fail("Not signed in.");
  const { error } = await supabase.from("profiles").update({ display_name: parsed.data }).eq("id", uid);
  if (error) return fail(friendlyError(error.message));
  revalidatePath("/app", "layout");
  return ok(undefined, "Name updated.");
}
