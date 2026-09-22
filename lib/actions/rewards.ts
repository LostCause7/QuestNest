"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireFamily } from "@/lib/data/family";
import { ok, fail, friendlyError, guardAction, type ActionResult } from "./result";
import type { Reward } from "@/types/database";

const rewardSchema = z.object({
  title: z.string().trim().min(1, "Give the reward a name.").max(80),
  description: z.string().trim().max(300).optional().nullable(),
  icon: z.string().trim().min(1).max(8),
  cost: z.number().int().min(0, "Cost can't be negative.").max(100000),
  stock: z.number().int().min(0).max(100000).nullable(),
  category: z.enum(["privilege", "item", "experience"]),
  requires_approval: z.boolean(),
  child_ids: z.array(z.uuid()).min(1, "Assign the reward to at least one kid."),
});

export type RewardInput = z.infer<typeof rewardSchema>;

function revalidate() {
  revalidatePath("/app", "layout");
  revalidatePath("/kids", "layout");
}

export async function createReward(input: RewardInput): Promise<ActionResult<Reward>> {
  return guardAction(async () => {
  const parsed = rewardSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  const family = await requireFamily();
  const supabase = await createClient();
  const { child_ids, ...rest } = parsed.data;
  const { data, error } = await supabase
    .from("rewards")
    .insert({ family_id: family.id, ...rest, description: rest.description || null })
    .select()
    .single();
  if (error || !data) return fail(friendlyError(error?.message ?? "Could not create reward."));
  const { error: asgErr } = await supabase
    .from("reward_assignments")
    .insert(child_ids.map((child_id) => ({ reward_id: data.id, child_id })));
  if (asgErr && !/does not exist|schema cache/i.test(asgErr.message)) return fail(friendlyError(asgErr.message));
  revalidate();
  return ok(data, "Reward added to the shop.");
  });
}

export async function updateReward(id: string, input: RewardInput): Promise<ActionResult<Reward>> {
  return guardAction(async () => {
  const parsed = rewardSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  await requireFamily();
  const supabase = await createClient();
  const { child_ids, ...rest } = parsed.data;
  const { data, error } = await supabase
    .from("rewards")
    .update({ ...rest, description: rest.description || null })
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return fail(friendlyError(error?.message ?? "Could not update reward."));

  const assignRes = await supabase.from("reward_assignments").select("child_id").eq("reward_id", id);
  if (!assignRes.error || !/does not exist|schema cache/i.test(assignRes.error.message)) {
    const currentIds = new Set((assignRes.data ?? []).map((c) => c.child_id));
    const nextIds = new Set(child_ids);
    const toAdd = child_ids.filter((c) => !currentIds.has(c));
    const toRemove = [...currentIds].filter((c) => !nextIds.has(c));
    if (toAdd.length) {
      const { error: e } = await supabase.from("reward_assignments").insert(toAdd.map((child_id) => ({ reward_id: id, child_id })));
      if (e && !/does not exist|schema cache/i.test(e.message)) return fail(friendlyError(e.message));
    }
    if (toRemove.length) {
      const { error: e } = await supabase.from("reward_assignments").delete().eq("reward_id", id).in("child_id", toRemove);
      if (e && !/does not exist|schema cache/i.test(e.message)) return fail(friendlyError(e.message));
    }
  }

  revalidate();
  return ok(data, "Reward saved.");
  });
}

export async function setRewardActive(id: string, active: boolean): Promise<ActionResult> {
  await requireFamily();
  const supabase = await createClient();
  const { error } = await supabase.from("rewards").update({ is_active: active }).eq("id", id);
  if (error) return fail(friendlyError(error.message));
  revalidate();
  return ok(undefined, active ? "Reward back in stock." : "Reward hidden from the shop.");
}

export async function deleteReward(id: string): Promise<ActionResult> {
  await requireFamily();
  const supabase = await createClient();
  const { error } = await supabase.from("rewards").delete().eq("id", id);
  if (error) return fail(friendlyError(error.message));
  revalidate();
  return ok(undefined, "Reward deleted.");
}

export async function resolveRedemption(
  redemptionId: string,
  action: "approve" | "reject" | "fulfill"
): Promise<ActionResult> {
  await requireFamily();
  const supabase = await createClient();
  const { error } = await supabase.rpc("resolve_redemption", { p_redemption: redemptionId, p_action: action });
  if (error) return fail(friendlyError(error.message));
  revalidate();
  const msg = { approve: "Reward approved.", reject: "Declined and points refunded.", fulfill: "Marked as delivered." }[action];
  return ok(undefined, msg);
}
