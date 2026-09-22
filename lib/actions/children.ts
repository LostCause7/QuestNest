"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireFamily } from "@/lib/data/family";
import { AVATAR_KEYS, COLOR_KEYS } from "@/lib/avatars";
import { ok, fail, friendlyError, guardAction, type ActionResult } from "./result";
import type { Child } from "@/types/database";

const childSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(40),
  avatar: z.enum(AVATAR_KEYS as [string, ...string[]]),
  color: z.enum(COLOR_KEYS as [string, ...string[]]),
});

const pinSchema = z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits.");

export type ChildInput = z.infer<typeof childSchema> & { pin?: string };

function revalidate() {
  revalidatePath("/app", "layout");
  revalidatePath("/kids", "layout");
}

export async function createChild(input: ChildInput): Promise<ActionResult<Child>> {
  return guardAction(async () => {
  const parsed = childSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  const pin = pinSchema.safeParse(input.pin);
  if (!pin.success) return fail(pin.error.issues[0]?.message ?? "Invalid PIN.");

  const family = await requireFamily();
  const supabase = await createClient();

  const { count } = await supabase
    .from("children")
    .select("id", { count: "exact", head: true })
    .eq("family_id", family.id);

  const { data, error } = await supabase
    .from("children")
    .insert({ family_id: family.id, ...parsed.data, sort_order: count ?? 0 })
    .select()
    .single();
  if (error || !data) return fail(friendlyError(error?.message ?? "Could not add kid."));

  const { error: pinErr } = await supabase.rpc("set_child_pin", { p_child: data.id, p_pin: pin.data });
  if (pinErr) return fail(friendlyError(pinErr.message));

  revalidate();
  return ok(data, `${data.name} joined the nest!`);
  });
}

export async function updateChild(id: string, input: ChildInput): Promise<ActionResult<Child>> {
  return guardAction(async () => {
  const parsed = childSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  await requireFamily();
  const supabase = await createClient();
  const { data, error } = await supabase.from("children").update(parsed.data).eq("id", id).select().single();
  if (error || !data) return fail(friendlyError(error?.message ?? "Could not update."));

  if (input.pin) {
    const pin = pinSchema.safeParse(input.pin);
    if (!pin.success) return fail(pin.error.issues[0]?.message ?? "Invalid PIN.");
    const { error: pinErr } = await supabase.rpc("set_child_pin", { p_child: id, p_pin: pin.data });
    if (pinErr) return fail(friendlyError(pinErr.message));
  }

  revalidate();
  return ok(data, "Saved.");
  });
}

export async function setChildActive(id: string, active: boolean): Promise<ActionResult> {
  await requireFamily();
  const supabase = await createClient();
  const { error } = await supabase.from("children").update({ is_active: active }).eq("id", id);
  if (error) return fail(friendlyError(error.message));
  revalidate();
  return ok(undefined, active ? "Kid reactivated." : "Kid archived.");
}

export async function deleteChild(id: string): Promise<ActionResult> {
  await requireFamily();
  const supabase = await createClient();
  const { error } = await supabase.from("children").delete().eq("id", id);
  if (error) return fail(friendlyError(error.message));
  revalidate();
  return ok(undefined, "Kid removed.");
}

export async function adjustPoints(childId: string, amount: number, note?: string): Promise<ActionResult> {
  const schema = z.object({
    amount: z.number().int().refine((n) => n !== 0, "Amount can't be zero.").refine((n) => Math.abs(n) <= 100000, "That's a lot of points."),
    note: z.string().trim().max(120).optional(),
  });
  const parsed = schema.safeParse({ amount, note });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  await requireFamily();
  const supabase = await createClient();
  const { error } = await supabase.rpc("adjust_points", {
    p_child: childId,
    p_amount: parsed.data.amount,
    p_note: parsed.data.note || null,
  });
  if (error) return fail(friendlyError(error.message));
  revalidate();
  return ok(undefined, parsed.data.amount > 0 ? "Bonus awarded!" : "Points deducted.");
}
