"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireFamily } from "@/lib/data/family";
import { ok, fail, friendlyError, type ActionResult } from "./result";
import type { Reward } from "@/types/database";

const rewardSchema = z.object({
  title: z.string().trim().min(1, "Give the reward a name.").max(80),
  description: z.string().trim().max(300).optional().nullable(),
  icon: z.string().trim().min(1).max(8),
  cost: z.number().int().min(0, "Cost can't be negative.").max(100000),
  stock: z.number().int().min(0).max(100000).nullable(),
  category: z.enum(["privilege", "item", "experience"]),
  requires_approval: z.boolean(),
});

export type RewardInput = z.infer<typeof rewardSchema>;

function revalidate() {
  revalidatePath("/app", "layout");
  revalidatePath("/kids", "layout");
}

export async function createReward(input: RewardInput): Promise<ActionResult<Reward>> {
  const parsed = rewardSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  const family = await requireFamily();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rewards")
    .insert({ family_id: family.id, ...parsed.data, description: parsed.data.description || null })
    .select()
    .single();
  if (error || !data) return fail(friendlyError(error?.message ?? "Could not create reward."));
  revalidate();
  return ok(data, "Reward added to the shop.");
}

export async function updateReward(id: string, input: RewardInput): Promise<ActionResult<Reward>> {
  const parsed = rewardSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  await requireFamily();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rewards")
    .update({ ...parsed.data, description: parsed.data.description || null })
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return fail(friendlyError(error?.message ?? "Could not update reward."));
  revalidate();
  return ok(data, "Reward saved.");
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
