"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireFamily } from "@/lib/data/family";
import { AVATAR_KEYS, COLOR_KEYS } from "@/lib/avatars";
import { itemsOf } from "@/lib/cosmetics";
import { KID_MODE_COOKIE } from "@/lib/supabase/proxy";
import { ok, fail, friendlyError, guardAction, type ActionResult } from "./result";
import type { Child } from "@/types/database";

async function kidModeBlocksManage() {
  return (await cookies()).get(KID_MODE_COOKIE)?.value === "1";
}

const FACE_KEYS = [...AVATAR_KEYS, ...itemsOf("face").map((f) => f.key)];
const COLOR_ALL = [...COLOR_KEYS, ...itemsOf("color").map((c) => c.key)];

const childSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(40),
  avatar: z.enum(FACE_KEYS as [string, ...string[]]),
  color: z.enum(COLOR_ALL as [string, ...string[]]),
  nickname: z.string().trim().max(24).optional().nullable(),
  motto: z.string().trim().max(80).optional().nullable(),
  cheer: z.string().trim().max(80).optional().nullable(),
});

function omitCheer<T extends { cheer?: unknown }>(row: T) {
  const next = { ...row };
  delete next.cheer;
  return next;
}

function omitFlavor<T extends { nickname?: unknown; motto?: unknown; cheer?: unknown }>(row: T) {
  const next = omitCheer(row);
  delete next.nickname;
  delete next.motto;
  return next;
}

const MISSING_COLUMN = /column|schema cache|does not exist/i;

const pinSchema = z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits.");

export type ChildInput = z.infer<typeof childSchema> & { pin?: string };

function revalidate() {
  revalidatePath("/app", "layout");
  revalidatePath("/kids", "layout");
}

export async function createChild(input: ChildInput): Promise<ActionResult<Child>> {
  return guardAction(async () => {
  if (await kidModeBlocksManage()) return fail("Ask a parent to add a kid.");
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

  const insertRow = { family_id: family.id, ...parsed.data, sort_order: count ?? 0 };
  let { data, error } = await supabase.from("children").insert(insertRow).select().single();
  if (error && MISSING_COLUMN.test(error.message)) {
    // 0009 (cheer) missing → drop it; 0007 (nickname/motto) missing → drop those too.
    const retry = await supabase.from("children").insert(omitCheer(insertRow)).select().single();
    data = retry.data;
    error = retry.error;
    if (error && MISSING_COLUMN.test(error.message)) {
      const core = await supabase.from("children").insert(omitFlavor(insertRow)).select().single();
      data = core.data;
      error = core.error;
    }
  }
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
  let { data, error } = await supabase.from("children").update(parsed.data).eq("id", id).select().single();
  if (error && MISSING_COLUMN.test(error.message)) {
    const retry = await supabase.from("children").update(omitCheer(parsed.data)).eq("id", id).select().single();
    data = retry.data;
    error = retry.error;
    if (error && MISSING_COLUMN.test(error.message)) {
      const core = await supabase.from("children").update(omitFlavor(parsed.data)).eq("id", id).select().single();
      data = core.data;
      error = core.error;
    }
  }
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
  return guardAction(async () => {
  const schema = z.object({
    amount: z.number().int().refine((n) => n !== 0, "Amount can't be zero.").refine((n) => Math.abs(n) <= 100000, "That's a lot of points."),
    note: z.string().trim().max(120).optional(),
  });
  const parsed = schema.safeParse({ amount, note });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const family = await requireFamily();
  const supabase = await createClient();
  const { data: child } = await supabase.from("children").select("id, family_id").eq("id", childId).maybeSingle();
  if (!child || child.family_id !== family.id) return fail("Kid not found.");

  const { data: claims } = await supabase.auth.getClaims();
  const payload = {
    p_child: childId,
    p_amount: parsed.data.amount,
    p_note: parsed.data.note || null,
  };
  let { error } = await supabase.rpc("adjust_points", payload);
  // Older adjust_points() inserts 'bonus'/'penalty' as text into tx_kind.
  if (error && /tx_kind|expression is of type text/i.test(error.message)) {
    const fallback = await supabase.from("point_transactions").insert({
      family_id: family.id,
      child_id: childId,
      amount: parsed.data.amount,
      kind: parsed.data.amount > 0 ? "bonus" : "penalty",
      note: parsed.data.note || null,
      created_by: (claims?.claims.sub as string | undefined) ?? null,
    });
    error = fallback.error;
  }
  if (error) return fail(friendlyError(error.message));
  revalidate();
  return ok(undefined, parsed.data.amount > 0 ? "Bonus awarded!" : "Points deducted.");
  });
}
