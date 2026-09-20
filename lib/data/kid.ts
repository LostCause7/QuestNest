import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_CHILD_COOKIE } from "@/lib/supabase/proxy";
import { getChildren, getChores, getCompletionsBetween, familyToday } from "@/lib/data/parent";
import { isChoreDueOn, type QuestStatus } from "@/lib/schedule";
import type { Child, Chore, ChoreCompletion, Family } from "@/types/database";

export const getActiveChildId = cache(async (): Promise<string | null> => {
  const store = await cookies();
  return store.get(ACTIVE_CHILD_COOKIE)?.value ?? null;
});

/** The unlocked kid for this device, or redirect to the PIN pad / picker. */
export async function requireActiveChild(family: Family, expectedId: string): Promise<Child> {
  const activeId = await getActiveChildId();
  if (activeId !== expectedId) redirect(`/kids/${expectedId}/pin`);
  const kids = await getChildren(family.id);
  const kid = kids.find((k) => k.id === expectedId);
  if (!kid) redirect("/kids");
  return kid;
}

export type QuestCard = {
  chore: Chore;
  status: QuestStatus;
  completion: ChoreCompletion | null;
};

/** Today's quest board for a kid: due chores with their current status. */
export const getQuestBoard = cache(async (family: Family, child: Child) => {
  const today = familyToday(family);
  const [chores, completions] = await Promise.all([
    getChores(family.id),
    getCompletionsBetween(family.id, today, today),
  ]);
  const supabase = await createClient();

  const mine = chores.filter((c) => c.is_active && c.child_ids.includes(child.id));

  // One-time quests stay on the board until they've been completed on *any* day.
  const onceIds = mine.filter((c) => c.recurrence === "once").map((c) => c.id);
  let onceDone = new Set<string>();
  if (onceIds.length) {
    const { data } = await supabase
      .from("chore_completions")
      .select("chore_id")
      .eq("child_id", child.id)
      .in("chore_id", onceIds)
      .in("status", ["pending", "approved"]);
    onceDone = new Set((data ?? []).map((d) => d.chore_id));
  }

  const cards: QuestCard[] = mine
    .filter((c) => (c.recurrence === "once" ? !onceDone.has(c.id) || completions.some((x) => x.chore_id === c.id && x.child_id === child.id) : isChoreDueOn(c, today)))
    .map((c) => {
      const completion = completions.find((x) => x.chore_id === c.id && x.child_id === child.id) ?? null;
      const status: QuestStatus = completion ? completion.status : "todo";
      return { chore: c, status, completion };
    })
    .sort((a, b) => order(a.status) - order(b.status) || b.chore.points - a.chore.points);

  return { today, cards };
});

function order(s: QuestStatus) {
  return { todo: 0, rejected: 1, pending: 2, approved: 3 }[s];
}
