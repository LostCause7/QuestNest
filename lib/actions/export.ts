"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireFamily, requireUser } from "@/lib/data/family";
import { fail, friendlyError, guardAction, ok, type ActionResult } from "./result";

export type FamilyExport = {
  exported_at: string;
  family: unknown;
  children: unknown[];
  chores: unknown[];
  rewards: unknown[];
  completions: unknown[];
  redemptions: unknown[];
  transactions: unknown[];
};

export async function exportFamilyBundle(): Promise<ActionResult<FamilyExport>> {
  return guardAction(async () => {
    const family = await requireFamily();
    const supabase = await createClient();
    const [children, chores, rewards, completions, redemptions, transactions] = await Promise.all([
      supabase.from("children").select("*").eq("family_id", family.id),
      supabase.from("chores").select("*").eq("family_id", family.id),
      supabase.from("rewards").select("*").eq("family_id", family.id),
      supabase.from("chore_completions").select("*").eq("family_id", family.id),
      supabase.from("reward_redemptions").select("*").eq("family_id", family.id),
      supabase.from("point_transactions").select("*").eq("family_id", family.id),
    ]);
    return ok({
      exported_at: new Date().toISOString(),
      family,
      children: children.data ?? [],
      chores: chores.data ?? [],
      rewards: rewards.data ?? [],
      completions: completions.data ?? [],
      redemptions: redemptions.data ?? [],
      transactions: transactions.data ?? [],
    });
  });
}

export async function deleteFamilyData(): Promise<ActionResult> {
  return guardAction(async () => {
    const user = await requireUser();
    const family = await requireFamily();
    if (family.owner_id !== user.id) return fail("Only the nest owner can delete this family.");
    const supabase = await createClient();
    const { error } = await supabase.from("families").delete().eq("id", family.id);
    if (error) return fail(friendlyError(error.message));
    await supabase.auth.signOut();
    redirect("/");
  });
}
