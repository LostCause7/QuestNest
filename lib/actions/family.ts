"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireFamily } from "@/lib/data/family";
import { ok, fail, friendlyError, type ActionResult } from "./result";

const settingsSchema = z.object({
  name: z.string().trim().min(1, "Family name is required.").max(60),
  currency_name: z.string().trim().min(1, "Currency name is required.").max(20),
  currency_emoji: z.string().trim().min(1, "Pick an emoji.").max(8),
  timezone: z.string().trim().min(1).max(64),
});

export type FamilySettingsInput = z.infer<typeof settingsSchema>;

export async function updateFamilySettings(input: FamilySettingsInput): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  const family = await requireFamily();
  const supabase = await createClient();
  const { error } = await supabase.from("families").update(parsed.data).eq("id", family.id);
  if (error) return fail(friendlyError(error.message));
  revalidatePath("/app", "layout");
  revalidatePath("/kids", "layout");
  return ok(undefined, "Settings saved.");
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
