import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/schedule";
import type {
  Child,
  Chore,
  ChoreAssignment,
  ChoreCompletion,
  Reward,
  RewardRedemption,
  PointTransaction,
  ChildBadge,
  Family,
} from "@/types/database";

export type ChoreWithKids = Chore & { child_ids: string[] };

export const getChildren = cache(async (familyId: string, includeInactive = false): Promise<Child[]> => {
  const supabase = await createClient();
  let q = supabase.from("children").select("*").eq("family_id", familyId).order("sort_order").order("created_at");
  if (!includeInactive) q = q.eq("is_active", true);
  const { data } = await q;
  return data ?? [];
});

export const getChores = cache(async (familyId: string): Promise<ChoreWithKids[]> => {
  const supabase = await createClient();
  const [{ data: chores }, { data: assignments }] = await Promise.all([
    supabase.from("chores").select("*").eq("family_id", familyId).order("created_at"),
    supabase.from("chore_assignments").select("*"),
  ]);
  const byChore = new Map<string, string[]>();
  for (const a of (assignments ?? []) as ChoreAssignment[]) {
    byChore.set(a.chore_id, [...(byChore.get(a.chore_id) ?? []), a.child_id]);
  }
  return (chores ?? []).map((c) => ({ ...c, child_ids: byChore.get(c.id) ?? [] }));
});

export const getRewards = cache(async (familyId: string): Promise<Reward[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("rewards").select("*").eq("family_id", familyId).order("cost");
  return data ?? [];
});

export const getCompletionsBetween = cache(
  async (familyId: string, from: string, to: string): Promise<ChoreCompletion[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("chore_completions")
      .select("*")
      .eq("family_id", familyId)
      .gte("for_date", from)
      .lte("for_date", to)
      .order("completed_at", { ascending: false });
    return data ?? [];
  }
);

export const getPendingCompletions = cache(async (familyId: string): Promise<ChoreCompletion[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chore_completions")
    .select("*")
    .eq("family_id", familyId)
    .eq("status", "pending")
    .order("completed_at", { ascending: true });
  return data ?? [];
});

export const getRedemptions = cache(
  async (familyId: string, statuses?: RewardRedemption["status"][], limit = 100): Promise<RewardRedemption[]> => {
    const supabase = await createClient();
    let q = supabase
      .from("reward_redemptions")
      .select("*")
      .eq("family_id", familyId)
      .order("requested_at", { ascending: false })
      .limit(limit);
    if (statuses?.length) q = q.in("status", statuses);
    const { data } = await q;
    return data ?? [];
  }
);

export const getTransactions = cache(
  async (familyId: string, opts: { childId?: string; limit?: number } = {}): Promise<PointTransaction[]> => {
    const supabase = await createClient();
    let q = supabase
      .from("point_transactions")
      .select("*")
      .eq("family_id", familyId)
      .order("created_at", { ascending: false })
      .limit(opts.limit ?? 50);
    if (opts.childId) q = q.eq("child_id", opts.childId);
    const { data } = await q;
    return data ?? [];
  }
);

export const getBadges = cache(async (childIds: string[]): Promise<ChildBadge[]> => {
  if (!childIds.length) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("child_badges").select("*").in("child_id", childIds);
  return data ?? [];
});

export const hasParentPin = cache(async (familyId: string): Promise<boolean> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("has_parent_pin", { p_family: familyId });
  return Boolean(data);
});

export function familyToday(family: Family) {
  return todayInTimezone(family.timezone);
}

export function shiftDate(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}
