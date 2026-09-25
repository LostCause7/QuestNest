"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireFamily } from "@/lib/data/family";
import { familyToday } from "@/lib/data/parent";
import { ACTIVE_CHILD_COOKIE, KID_MODE_COOKIE } from "@/lib/supabase/proxy";
import { safeNext } from "@/lib/origin";
import { ok, fail, friendlyError, type ActionResult } from "./result";
import type { ChoreCompletion, RewardRedemption } from "@/types/database";

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

async function activeChildId() {
  const store = await cookies();
  return store.get(ACTIVE_CHILD_COOKIE)?.value ?? null;
}

/** Kid enters their PIN on the picker. */
export async function unlockChild(childId: string, pin: string): Promise<ActionResult> {
  const parsed = z.object({ childId: z.uuid(), pin: z.string().regex(/^\d{4}$/) }).safeParse({ childId, pin });
  if (!parsed.success) return fail("That PIN doesn't look right.");

  await requireFamily();
  const supabase = await createClient();
  const { data: valid, error } = await supabase.rpc("verify_child_pin", { p_child: childId, p_pin: pin });
  if (error) return fail(friendlyError(error.message));
  if (!valid) return fail("Oops, wrong PIN. Try again!");

  const store = await cookies();
  store.set(ACTIVE_CHILD_COOKIE, childId, cookieOpts);
  store.set(KID_MODE_COOKIE, "1", { ...cookieOpts, maxAge: 60 * 60 * 24 * 365 });
  redirect(`/kids/${childId}`);
}

/** Back to the profile picker. */
export async function switchChild() {
  const store = await cookies();
  store.delete(ACTIVE_CHILD_COOKIE);
  redirect("/kids");
}

/** Kid taps "Done!" on a quest. */
export async function completeQuest(choreId: string): Promise<ActionResult<ChoreCompletion>> {
  const childId = await activeChildId();
  if (!childId) return fail("Pick your profile first.");
  const family = await requireFamily();
  const supabase = await createClient();
  const today = familyToday(family);

  const { data: choreRow, error: choreErr } = await supabase
    .from("chores")
    .select("id, single_claim")
    .eq("id", choreId)
    .maybeSingle();
  if (choreErr && !/column|schema cache|does not exist/i.test(choreErr.message)) {
    return fail(friendlyError(choreErr.message));
  }
  if (choreRow?.single_claim) {
    const takenRes = await supabase
      .from("chore_completions")
      .select("id, excuse")
      .eq("chore_id", choreId)
      .eq("for_date", today)
      .neq("child_id", childId)
      .in("status", ["pending", "approved"]);
    const taken = (takenRes.error ? [] : takenRes.data ?? []).filter((r) => !r.excuse);
    if (taken.length) return fail("A sibling already claimed that quest today.");
  }

  const { data: existing } = await supabase
    .from("chore_completions")
    .select("id, status, excuse")
    .eq("chore_id", choreId)
    .eq("child_id", childId)
    .eq("for_date", today)
    .maybeSingle();

  // Parent said "Not yet" — reuse today's row instead of inserting a duplicate.
  if (existing?.status === "rejected") {
    const { data: chore } = await supabase
      .from("chores")
      .select("title, points, requires_approval, family_id")
      .eq("id", choreId)
      .maybeSingle();
    const { data: claims } = await supabase.auth.getClaims();
    const userId = claims?.claims.sub ?? null;
    const autoApprove = chore ? !chore.requires_approval : false;

    const { data, error } = await supabase
      .from("chore_completions")
      .update({
        status: autoApprove ? "approved" : "pending",
        excuse: false,
        points_awarded: autoApprove ? (chore?.points ?? 0) : null,
        note: null,
        completed_at: new Date().toISOString(),
        reviewed_at: autoApprove ? new Date().toISOString() : null,
        reviewed_by: autoApprove ? userId : null,
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error || !data) return fail(friendlyError(error?.message ?? "Could not resubmit that quest."));

    if (autoApprove && chore) {
      const { error: txErr } = await supabase.from("point_transactions").insert({
        family_id: chore.family_id,
        child_id: childId,
        amount: chore.points,
        kind: "chore",
        ref_id: data.id,
        note: chore.title,
        created_by: userId,
      });
      if (txErr) return fail(friendlyError(txErr.message));
    }

    revalidatePath("/kids", "layout");
    revalidatePath("/app", "layout");
    return ok(data);
  }

  const { data, error } = await supabase.rpc("complete_chore", {
    p_chore: choreId,
    p_child: childId,
    p_date: today,
  });
  if (error) return fail(friendlyError(error.message));
  revalidatePath("/kids", "layout");
  revalidatePath("/app", "layout");
  return ok(data as ChoreCompletion);
}

/** Kid asks a parent to skip this quest today (no points, no mandatory penalty if confirmed or still pending). */
export async function requestSkip(choreId: string): Promise<ActionResult<ChoreCompletion>> {
  const childId = await activeChildId();
  if (!childId) return fail("Pick your profile first.");
  const family = await requireFamily();
  const supabase = await createClient();
  const today = familyToday(family);

  const { data: chore, error: choreErr } = await supabase
    .from("chores")
    .select("id, family_id, title, allow_skip, is_active")
    .eq("id", choreId)
    .maybeSingle();
  if (choreErr && /column|schema cache|does not exist/i.test(choreErr.message)) {
    return fail("Skipping quests needs the latest nest update. Ask a parent to run 0012_skip_requests.sql.");
  }
  if (choreErr) return fail(friendlyError(choreErr.message));
  if (!chore?.is_active) return fail("That quest isn't available.");
  if (!chore.allow_skip) return fail("This quest can't be skipped.");

  const { data: assigned } = await supabase
    .from("chore_assignments")
    .select("child_id")
    .eq("chore_id", choreId)
    .eq("child_id", childId)
    .maybeSingle();
  if (!assigned) return fail("That quest isn't yours.");

  const { data: existing } = await supabase
    .from("chore_completions")
    .select("id, status, excuse")
    .eq("chore_id", choreId)
    .eq("child_id", childId)
    .eq("for_date", today)
    .maybeSingle();

  if (existing && existing.status !== "rejected" && !(existing.status === "pending" && existing.excuse)) {
    return fail("That quest is already checked off for today.");
  }

  const payload = {
    status: "pending" as const,
    excuse: true,
    points_awarded: null,
    note: null,
    completed_at: new Date().toISOString(),
    reviewed_at: null,
    reviewed_by: null,
  };

  if (existing) {
    const { data, error } = await supabase.from("chore_completions").update(payload).eq("id", existing.id).select().single();
    if (error || !data) return fail(friendlyError(error?.message ?? "Could not ask to skip."));
    revalidatePath("/kids", "layout");
    revalidatePath("/app", "layout");
    return ok(data);
  }

  const { data, error } = await supabase
    .from("chore_completions")
    .insert({
      family_id: chore.family_id,
      chore_id: choreId,
      child_id: childId,
      for_date: today,
      ...payload,
    })
    .select()
    .single();
  if (error || !data) return fail(friendlyError(error?.message ?? "Could not ask to skip."));
  revalidatePath("/kids", "layout");
  revalidatePath("/app", "layout");
  return ok(data);
}

/** Kid buys something in the shop. Optional cost is for cash rewards ($5 steps). */
export async function redeemRewardAsKid(rewardId: string, cost?: number): Promise<ActionResult<RewardRedemption>> {
  const childId = await activeChildId();
  if (!childId) return fail("Pick your profile first.");
  await requireFamily();
  const supabase = await createClient();
  const assigned = await supabase.from("reward_assignments").select("child_id").eq("reward_id", rewardId);
  if (!assigned.error && assigned.data?.length && !assigned.data.some((a) => a.child_id === childId)) {
    return fail("That reward isn't in your shop.");
  }
  const { data, error } = await supabase.rpc(
    "redeem_reward",
    typeof cost === "number"
      ? { p_reward: rewardId, p_child: childId, p_cost: cost }
      : { p_reward: rewardId, p_child: childId }
  );
  if (error && typeof cost === "number" && /could not find the function|p_cost|function.*redeem_reward/i.test(error.message)) {
    return fail("Cash amounts need the latest nest update. Ask a parent to run 0013_cash_redeem_and_cancel.sql.");
  }
  if (error) return fail(friendlyError(error.message));
  revalidatePath("/kids", "layout");
  revalidatePath("/app", "layout");
  return ok(data as RewardRedemption);
}

/** Kid changes their mind before the reward is delivered. Points come back. */
export async function cancelRedemptionAsKid(redemptionId: string): Promise<ActionResult> {
  const childId = await activeChildId();
  if (!childId) return fail("Pick your profile first.");
  await requireFamily();
  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("reward_redemptions")
    .select("id, child_id, status")
    .eq("id", redemptionId)
    .maybeSingle();
  if (fetchErr) return fail(friendlyError(fetchErr.message));
  if (!row || row.child_id !== childId) return fail("That reward isn't yours.");
  if (row.status !== "pending" && row.status !== "approved") return fail("Too late to change your mind — it's already done.");

  const { error } = await supabase.rpc("resolve_redemption", { p_redemption: redemptionId, p_action: "cancel" });
  if (error && /invalid action|cancel/i.test(error.message) && row.status === "pending") {
    const retry = await supabase.rpc("resolve_redemption", { p_redemption: redemptionId, p_action: "reject" });
    if (retry.error) return fail(friendlyError(retry.error.message));
  } else if (error) {
    if (/invalid action|cancel/i.test(error.message)) {
      return fail("Changing your mind needs the latest nest update. Ask a parent to run 0013_cash_redeem_and_cancel.sql.");
    }
    return fail(friendlyError(error.message));
  }
  revalidatePath("/kids", "layout");
  revalidatePath("/app", "layout");
  return ok(undefined, "Changed your mind. Points are back!");
}

/** Parent enters their PIN to leave Kid Mode. */
export async function exitKidMode(pin: string | null, next?: string): Promise<ActionResult> {
  const family = await requireFamily();
  const supabase = await createClient();

  const { data: hasPin } = await supabase.rpc("has_parent_pin", { p_family: family.id });
  if (hasPin) {
    if (!pin || !/^\d{4,6}$/.test(pin)) return fail("Enter the parent PIN.");
    const { data: valid, error } = await supabase.rpc("verify_parent_pin", { p_family: family.id, p_pin: pin });
    if (error) return fail(friendlyError(error.message));
    if (!valid) return fail("That's not the parent PIN.");
  }

  const store = await cookies();
  store.delete(ACTIVE_CHILD_COOKIE);
  store.delete(KID_MODE_COOKIE);
  redirect(safeNext(next, "/app"));
}

/** Extra parent profile enters their own PIN. */
export async function unlockExtraParent(parentId: string, pin: string): Promise<ActionResult> {
  const parsed = z.object({ parentId: z.uuid(), pin: z.string().regex(/^\d{4}$/) }).safeParse({ parentId, pin });
  if (!parsed.success) return fail("That PIN doesn't look right.");
  await requireFamily();
  const supabase = await createClient();
  const { data: valid, error } = await supabase.rpc("verify_parent_profile_pin", {
    p_parent: parsed.data.parentId,
    p_pin: parsed.data.pin,
  });
  if (error && /does not exist|schema cache/i.test(error.message)) {
    return fail("Extra parents need the latest nest update.");
  }
  if (error) return fail(friendlyError(error.message));
  if (!valid) return fail("That's not their PIN.");

  const store = await cookies();
  store.delete(ACTIVE_CHILD_COOKIE);
  store.delete(KID_MODE_COOKIE);
  redirect("/app");
}
