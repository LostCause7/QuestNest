"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireFamily } from "@/lib/data/family";
import { ok, fail, friendlyError, guardAction, type ActionResult } from "./result";
import type { Chore } from "@/types/database";

const choreSchema = z.object({
  title: z.string().trim().min(1, "Give the quest a name.").max(80),
  description: z.string().trim().max(300).optional().nullable(),
  icon: z.string().trim().min(1).max(8),
  points: z.number().int().min(0, "Points can't be negative.").max(10000),
  recurrence: z.enum(["once", "daily", "weekly", "custom"]),
  days_of_week: z.array(z.number().int().min(0).max(6)).min(0).max(7),
  requires_approval: z.boolean(),
  child_ids: z.array(z.uuid()).min(1, "Assign the quest to at least one kid."),
});

export type ChoreInput = z.infer<typeof choreSchema>;

function revalidate() {
  revalidatePath("/app", "layout");
  revalidatePath("/kids", "layout");
}

function normalizeDays(input: ChoreInput) {
  if (input.recurrence === "daily" || input.recurrence === "once") return [0, 1, 2, 3, 4, 5, 6];
  return [...new Set(input.days_of_week)].sort();
}

export async function createChore(input: ChoreInput): Promise<ActionResult<Chore>> {
  return guardAction(async () => {
  const parsed = choreSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  const family = await requireFamily();
  const supabase = await createClient();

  const { child_ids, ...rest } = parsed.data;
  const { data, error } = await supabase
    .from("chores")
    .insert({ family_id: family.id, ...rest, description: rest.description || null, days_of_week: normalizeDays(parsed.data) })
    .select()
    .single();
  if (error || !data) return fail(friendlyError(error?.message ?? "Could not create quest."));

  const { error: asgErr } = await supabase
    .from("chore_assignments")
    .insert(child_ids.map((child_id) => ({ chore_id: data.id, child_id })));
  if (asgErr) return fail(friendlyError(asgErr.message));

  revalidate();
  return ok(data, "Quest created.");
  });
}

export async function updateChore(id: string, input: ChoreInput): Promise<ActionResult<Chore>> {
  return guardAction(async () => {
  const parsed = choreSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  await requireFamily();
  const supabase = await createClient();

  const { child_ids, ...rest } = parsed.data;
  const { data, error } = await supabase
    .from("chores")
    .update({ ...rest, description: rest.description || null, days_of_week: normalizeDays(parsed.data) })
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return fail(friendlyError(error?.message ?? "Could not update quest."));

  // Sync assignments
  const { data: current } = await supabase.from("chore_assignments").select("child_id").eq("chore_id", id);
  const currentIds = new Set((current ?? []).map((c) => c.child_id));
  const nextIds = new Set(child_ids);
  const toAdd = child_ids.filter((c) => !currentIds.has(c));
  const toRemove = [...currentIds].filter((c) => !nextIds.has(c));

  if (toAdd.length) {
    const { error: e } = await supabase
      .from("chore_assignments")
      .insert(toAdd.map((child_id) => ({ chore_id: id, child_id })));
    if (e) return fail(friendlyError(e.message));
  }
  if (toRemove.length) {
    const { error: e } = await supabase.from("chore_assignments").delete().eq("chore_id", id).in("child_id", toRemove);
    if (e) return fail(friendlyError(e.message));
  }

  revalidate();
  return ok(data, "Quest saved.");
  });
}

export async function setChoreActive(id: string, active: boolean): Promise<ActionResult> {
  await requireFamily();
  const supabase = await createClient();
  const { error } = await supabase.from("chores").update({ is_active: active }).eq("id", id);
  if (error) return fail(friendlyError(error.message));
  revalidate();
  return ok(undefined, active ? "Quest resumed." : "Quest paused.");
}

export async function deleteChore(id: string): Promise<ActionResult> {
  await requireFamily();
  const supabase = await createClient();
  const { error } = await supabase.from("chores").delete().eq("id", id);
  if (error) return fail(friendlyError(error.message));
  revalidate();
  return ok(undefined, "Quest deleted.");
}

/** Parent marks a quest done on behalf of a kid (goes through the same RPC). */
export async function completeChoreAsParent(choreId: string, childId: string, forDate: string): Promise<ActionResult> {
  await requireFamily();
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_chore", { p_chore: choreId, p_child: childId, p_date: forDate });
  if (error) return fail(friendlyError(error.message));
  revalidate();
  return ok(undefined, "Marked as done.");
}

export async function reviewCompletion(
  completionId: string,
  approve: boolean,
  points?: number,
  note?: string
): Promise<ActionResult> {
  const family = await requireFamily();
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub ?? null;
  const parentNote = note?.trim() ? note.trim().slice(0, 280) : null;

  const { data: row, error: fetchErr } = await supabase
    .from("chore_completions")
    .select("id, family_id, chore_id, child_id, status")
    .eq("id", completionId)
    .eq("family_id", family.id)
    .maybeSingle();
  if (fetchErr) return fail(friendlyError(fetchErr.message));
  if (!row) return fail("That quest wasn't found.");
  if (row.status !== "pending") return fail("That one was already reviewed.");

  const { data: chore } = await supabase.from("chores").select("title, points").eq("id", row.chore_id).maybeSingle();
  const awarded = approve ? (typeof points === "number" ? points : (chore?.points ?? 0)) : 0;

  const { error: updErr } = await supabase
    .from("chore_completions")
    .update({
      status: approve ? "approved" : "rejected",
      points_awarded: awarded,
      note: approve ? null : parentNote,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    })
    .eq("id", completionId)
    .eq("status", "pending");
  if (updErr) return fail(friendlyError(updErr.message));

  if (approve) {
    const { error: txErr } = await supabase.from("point_transactions").insert({
      family_id: row.family_id,
      child_id: row.child_id,
      amount: awarded,
      kind: "chore",
      ref_id: row.id,
      note: chore?.title ?? "Quest",
      created_by: userId,
    });
    if (txErr) return fail(friendlyError(txErr.message));
  }

  revalidate();
  return ok(undefined, approve ? "Approved! Points awarded." : "Sent back.");
}
