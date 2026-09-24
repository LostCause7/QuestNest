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
  kind: z.enum(["quest", "kindness"]).optional(),
  single_claim: z.boolean().optional(),
  mandatory: z.boolean().optional(),
  allow_skip: z.boolean().optional(),
  child_ids: z.array(z.uuid()).min(1, "Assign the quest to at least one kid."),
});

export type ChoreInput = z.infer<typeof choreSchema>;

const MISSING_COLUMN = /column|schema cache|does not exist/i;

function withoutKind<T extends { kind?: unknown }>(row: T) {
  const next = { ...row };
  delete next.kind;
  return next;
}

function withoutSingleClaim<T extends { single_claim?: unknown }>(row: T) {
  const next = { ...row };
  delete next.single_claim;
  return next;
}

function withoutMandatory<T extends { mandatory?: unknown }>(row: T) {
  const next = { ...row };
  delete next.mandatory;
  return next;
}

function withoutAllowSkip<T extends { allow_skip?: unknown }>(row: T) {
  const next = { ...row };
  delete next.allow_skip;
  return next;
}

function withoutOptionalColumns<T extends { kind?: unknown; single_claim?: unknown; mandatory?: unknown; allow_skip?: unknown }>(row: T) {
  return withoutKind(withoutSingleClaim(withoutMandatory(withoutAllowSkip(row))));
}

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
  const row = {
    family_id: family.id,
    ...rest,
    kind: rest.kind ?? "quest",
    single_claim: rest.single_claim ?? false,
    mandatory: rest.mandatory ?? false,
    allow_skip: rest.allow_skip ?? false,
    description: rest.description || null,
    days_of_week: normalizeDays(parsed.data),
  };
  let { data, error } = await supabase.from("chores").insert(row).select().single();
  if (error && MISSING_COLUMN.test(error.message)) {
    const retry = await supabase.from("chores").insert(withoutAllowSkip(row)).select().single();
    data = retry.data;
    error = retry.error;
  }
  if (error && MISSING_COLUMN.test(error.message)) {
    const retry = await supabase.from("chores").insert(withoutMandatory(withoutAllowSkip(row))).select().single();
    data = retry.data;
    error = retry.error;
  }
  if (error && MISSING_COLUMN.test(error.message)) {
    const retry = await supabase.from("chores").insert(withoutSingleClaim(withoutMandatory(withoutAllowSkip(row)))).select().single();
    data = retry.data;
    error = retry.error;
  }
  if (error && MISSING_COLUMN.test(error.message)) {
    const retry = await supabase.from("chores").insert(withoutOptionalColumns(row)).select().single();
    data = retry.data;
    error = retry.error;
  }
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
  const row = {
    ...rest,
    kind: rest.kind ?? "quest",
    single_claim: rest.single_claim ?? false,
    mandatory: rest.mandatory ?? false,
    allow_skip: rest.allow_skip ?? false,
    description: rest.description || null,
    days_of_week: normalizeDays(parsed.data),
  };
  let { data, error } = await supabase.from("chores").update(row).eq("id", id).select().single();
  if (error && MISSING_COLUMN.test(error.message)) {
    const retry = await supabase.from("chores").update(withoutAllowSkip(row)).eq("id", id).select().single();
    data = retry.data;
    error = retry.error;
  }
  if (error && MISSING_COLUMN.test(error.message)) {
    const retry = await supabase.from("chores").update(withoutMandatory(withoutAllowSkip(row))).eq("id", id).select().single();
    data = retry.data;
    error = retry.error;
  }
  if (error && MISSING_COLUMN.test(error.message)) {
    const retry = await supabase.from("chores").update(withoutSingleClaim(withoutMandatory(withoutAllowSkip(row)))).eq("id", id).select().single();
    data = retry.data;
    error = retry.error;
  }
  if (error && MISSING_COLUMN.test(error.message)) {
    const retry = await supabase.from("chores").update(withoutOptionalColumns(row)).eq("id", id).select().single();
    data = retry.data;
    error = retry.error;
  }
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
    .select("id, family_id, chore_id, child_id, status, excuse")
    .eq("id", completionId)
    .eq("family_id", family.id)
    .maybeSingle();
  if (fetchErr && MISSING_COLUMN.test(fetchErr.message)) {
    const retry = await supabase
      .from("chore_completions")
      .select("id, family_id, chore_id, child_id, status")
      .eq("id", completionId)
      .eq("family_id", family.id)
      .maybeSingle();
    if (retry.error) return fail(friendlyError(retry.error.message));
    if (!retry.data) return fail("That quest wasn't found.");
    if (retry.data.status !== "pending") return fail("That one was already reviewed.");
    return reviewDone(supabase, { ...retry.data, excuse: false }, approve, points, parentNote, userId);
  }
  if (fetchErr) return fail(friendlyError(fetchErr.message));
  if (!row) return fail("That quest wasn't found.");
  if (row.status !== "pending") return fail("That one was already reviewed.");
  return reviewDone(supabase, row, approve, points, parentNote, userId);
}

async function reviewDone(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: { id: string; family_id: string; chore_id: string; child_id: string; status: string; excuse?: boolean | null },
  approve: boolean,
  points: number | undefined,
  parentNote: string | null,
  userId: string | null
): Promise<ActionResult> {
  const { data: chore } = await supabase.from("chores").select("title, points").eq("id", row.chore_id).maybeSingle();
  const isExcuse = Boolean(row.excuse);
  const awarded = approve && !isExcuse ? (typeof points === "number" ? points : (chore?.points ?? 0)) : 0;
  const nextStatus = approve ? (isExcuse ? "excused" : "approved") : "rejected";

  const { error: updErr } = await supabase
    .from("chore_completions")
    .update({
      status: nextStatus,
      points_awarded: awarded,
      note: approve ? null : parentNote,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    })
    .eq("id", row.id)
    .eq("status", "pending");
  if (updErr) {
    if (isExcuse && /invalid input value|excused/i.test(updErr.message)) {
      return fail("Skipping quests needs the latest nest update. Run 0012_skip_requests.sql.");
    }
    return fail(friendlyError(updErr.message));
  }

  if (approve && !isExcuse) {
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
  const message = !approve
    ? "Sent back."
    : isExcuse
      ? "Skipped — no points lost."
      : "Approved! Points awarded.";
  return ok(undefined, message);
}
