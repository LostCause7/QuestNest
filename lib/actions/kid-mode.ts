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
  const { data, error } = await supabase.rpc("complete_chore", {
    p_chore: choreId,
    p_child: childId,
    p_date: familyToday(family),
  });
  if (error) return fail(friendlyError(error.message));
  revalidatePath("/kids", "layout");
  revalidatePath("/app", "layout");
  return ok(data as ChoreCompletion);
}

/** Kid buys something in the shop. */
export async function redeemRewardAsKid(rewardId: string): Promise<ActionResult<RewardRedemption>> {
  const childId = await activeChildId();
  if (!childId) return fail("Pick your profile first.");
  await requireFamily();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_reward", { p_reward: rewardId, p_child: childId });
  if (error) return fail(friendlyError(error.message));
  revalidatePath("/kids", "layout");
  revalidatePath("/app", "layout");
  return ok(data as RewardRedemption);
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
