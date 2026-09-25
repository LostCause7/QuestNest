import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { mandatorySettleThrough, todayInTimezone } from "@/lib/schedule";
import type {
  Child,
  Chore,
  ChoreAssignment,
  ChoreCompletion,
  Reward,
  RewardAssignment,
  RewardRedemption,
  PointTransaction,
  ChildBadge,
  ChildDayAward,
  ChildKudos,
  ChoreMissPenalty,
  Family,
  FamilyMilestone,
  ParentProfile,
} from "@/types/database";

export type ChoreWithKids = Chore & { child_ids: string[] };
export type RewardWithKids = Reward & { child_ids: string[] };

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

export const getRewards = cache(async (familyId: string): Promise<RewardWithKids[]> => {
  const supabase = await createClient();
  const rewardsRes = await supabase.from("rewards").select("*").eq("family_id", familyId).order("cost");
  const assignRes = await supabase.from("reward_assignments").select("*");
  const rewards = rewardsRes.data;
  const assignments = assignRes.error ? [] : assignRes.data;
  const byReward = new Map<string, string[]>();
  for (const a of (assignments ?? []) as RewardAssignment[]) {
    byReward.set(a.reward_id, [...(byReward.get(a.reward_id) ?? []), a.child_id]);
  }
  return (rewards ?? []).map((r) => ({ ...r, child_ids: byReward.get(r.id) ?? [] }));
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
    return omitReversedLedger(familyId, data ?? []);
  }
);

/** Hide leftover undo/refund pairs from the previous Activity undo (those are now erased instead). */
async function omitReversedLedger(familyId: string, txs: PointTransaction[]): Promise<PointTransaction[]> {
  if (!txs.length) return txs;
  const supabase = await createClient();
  const ids = txs.map((t) => t.id);
  const hide = new Set<string>();

  const { data: pointing } = await supabase
    .from("point_transactions")
    .select("id, ref_id")
    .eq("family_id", familyId)
    .eq("kind", "refund")
    .in("ref_id", ids);
  for (const row of pointing ?? []) {
    hide.add(row.id);
    if (row.ref_id) hide.add(row.ref_id);
  }

  const refundRefs = txs.filter((t) => t.kind === "refund" && t.ref_id).map((t) => t.ref_id as string);
  if (refundRefs.length) {
    const { data: originals } = await supabase
      .from("point_transactions")
      .select("id")
      .eq("family_id", familyId)
      .in("id", refundRefs);
    const originalIds = new Set((originals ?? []).map((r) => r.id));
    for (const t of txs) {
      if (t.kind === "refund" && t.ref_id && originalIds.has(t.ref_id)) {
        hide.add(t.id);
        hide.add(t.ref_id);
      }
    }
  }

  return txs.filter((t) => !hide.has(t.id));
}

export const getBadges = cache(async (childIds: string[]): Promise<ChildBadge[]> => {
  if (!childIds.length) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("child_badges").select("*").in("child_id", childIds);
  return data ?? [];
});

export const getFamilyMilestones = cache(async (familyId: string): Promise<FamilyMilestone[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("family_milestones")
    .select("*")
    .eq("family_id", familyId)
    .order("lifetime_points");
  if (error) return [];
  return (data ?? []) as FamilyMilestone[];
});

export const getParentProfiles = cache(async (familyId: string): Promise<ParentProfile[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parent_profiles")
    .select("*")
    .eq("family_id", familyId)
    .order("sort_order")
    .order("created_at");
  if (error) return [];
  return (data ?? []) as ParentProfile[];
});

/** Parent-gifted cosmetics ("kind:key"). Empty until 0009 is applied. */
export const getChildGifts = cache(async (childId: string): Promise<string[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("child_unlock_gifts").select("item_key").eq("child_id", childId);
  if (error) return [];
  return (data ?? []).map((g) => g.item_key);
});

/** Kudos from today in the nest timezone. Empty until 0009 is applied. */
export const getRecentKudos = cache(async (childId: string, timezone?: string): Promise<ChildKudos[]> => {
  const supabase = await createClient();
  const since = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("child_kudos")
    .select("*")
    .eq("child_id", childId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) return [];
  const rows = (data ?? []) as ChildKudos[];
  if (!timezone) return rows.slice(0, 5);
  const today = todayInTimezone(timezone);
  return rows.filter((k) => todayInTimezone(timezone, new Date(k.created_at)) === today).slice(0, 5);
});

/** Approved kindness quests for a kid (all time). 0 until 0009 adds chores.kind. */
export const getKindnessCount = cache(async (childId: string): Promise<number> => {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("chore_completions")
    .select("id, chores!inner(kind)", { count: "exact", head: true })
    .eq("child_id", childId)
    .eq("status", "approved")
    .eq("chores.kind", "kindness");
  if (error) return 0;
  return count ?? 0;
});

/** Daily awards (perfect days, combos, nest eggs…) for a kid in a date range. Empty until 0009. */
export const getDayAwards = cache(async (childId: string, from: string, to: string): Promise<ChildDayAward[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("child_day_awards")
    .select("*")
    .eq("child_id", childId)
    .gte("for_date", from)
    .lte("for_date", to)
    .order("for_date", { ascending: false });
  if (error) return [];
  return (data ?? []) as ChildDayAward[];
});

/** Approved quest count per kid inside a window (used by the season pass). */
export const getApprovedCounts = cache(async (familyId: string, from: string, to: string): Promise<Record<string, number>> => {
  const rows = await getCompletionsBetween(familyId, from, to);
  const out: Record<string, number> = {};
  for (const r of rows) if (r.status === "approved") out[r.child_id] = (out[r.child_id] ?? 0) + 1;
  return out;
});

const MISSING = /does not exist|schema cache|column/i;

/** Apply missed-mandatory deductions after 11:50pm local (or yesterday before noon as catch-up). */
export const settleMandatoryPenalties = cache(async (family: Family): Promise<number> => {
  const through = mandatorySettleThrough(family.timezone);
  if (!through) return 0;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("settle_mandatory_penalties", {
    p_family: family.id,
    p_through: through,
  });
  if (error) {
    if (!MISSING.test(error.message)) console.error("settle_mandatory_penalties", error.message);
    return 0;
  }
  return data ?? 0;
});

/** Drop yesterday's kid kudos. Miss penalty rows stay so settle cannot charge twice. */
export const clearKidNotices = cache(async (family: Family): Promise<void> => {
  const supabase = await createClient();
  const today = familyToday(family);
  const { error } = await supabase.rpc("clear_kid_notices", {
    p_family: family.id,
    p_today: today,
  });
  if (error && !MISSING.test(error.message)) console.error("clear_kid_notices", error.message);
});

export const getRecentMisses = cache(async (childId: string, from: string, to: string): Promise<ChoreMissPenalty[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chore_miss_penalties")
    .select("*")
    .eq("child_id", childId)
    .gte("for_date", from)
    .lte("for_date", to)
    .order("for_date", { ascending: false });
  if (error) return [];
  return (data ?? []) as ChoreMissPenalty[];
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
