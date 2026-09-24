import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_CHILD_COOKIE } from "@/lib/supabase/proxy";
import { getChildren, getChores, getCompletionsBetween, familyToday, shiftDate } from "@/lib/data/parent";
import { isChoreDueOn, siblingClaim, type QuestStatus } from "@/lib/schedule";
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

export type TakenQuest = { title: string; icon: string; byName: string };

/** Today's quest board for a kid: due chores with their current status. */
export const getQuestBoard = cache(async (family: Family, child: Child) => {
  const today = familyToday(family);
  const [chores, completions, kids] = await Promise.all([
    getChores(family.id),
    getCompletionsBetween(family.id, today, today),
    getChildren(family.id),
  ]);
  const supabase = await createClient();
  const nameOf = (id: string) => kids.find((k) => k.id === id)?.name ?? "A sibling";

  const mine = chores.filter((c) => c.is_active && c.child_ids.includes(child.id));

  // One-time quests stay on the board until they've been completed on *any* day.
  const onceIds = mine.filter((c) => c.recurrence === "once").map((c) => c.id);
  let onceDone = new Set<string>();
  if (onceIds.length) {
    const { data } = await supabase
      .from("chore_completions")
      .select("chore_id, excuse")
      .eq("child_id", child.id)
      .in("chore_id", onceIds)
      .in("status", ["pending", "approved"]);
    onceDone = new Set((data ?? []).filter((d) => !d.excuse).map((d) => d.chore_id));
  }

  // Exclusive one-time quests a sibling already finished (any day) leave this board.
  const exclusiveOnceIds = mine.filter((c) => c.single_claim && c.recurrence === "once").map((c) => c.id);
  const onceTakenBySibling = new Set<string>();
  if (exclusiveOnceIds.length) {
    const { data, error } = await supabase
      .from("chore_completions")
      .select("chore_id, excuse")
      .in("chore_id", exclusiveOnceIds)
      .neq("child_id", child.id)
      .in("status", ["pending", "approved"]);
    if (!error) {
      for (const row of data ?? []) if (!row.excuse) onceTakenBySibling.add(row.chore_id);
    }
  }

  const takenToday: TakenQuest[] = [];
  const cards: QuestCard[] = mine
    .filter((c) => {
      if (c.recurrence === "once") {
        if (onceTakenBySibling.has(c.id) && !completions.some((x) => x.chore_id === c.id && x.child_id === child.id)) {
          const todayClaim = siblingClaim(c, child.id, today, completions);
          if (todayClaim) takenToday.push({ title: c.title, icon: c.icon, byName: nameOf(todayClaim.child_id) });
          return false;
        }
        return !onceDone.has(c.id) || completions.some((x) => x.chore_id === c.id && x.child_id === child.id);
      }
      return isChoreDueOn(c, today);
    })
    .flatMap((c) => {
      const taken = siblingClaim(c, child.id, today, completions);
      if (taken) {
        takenToday.push({ title: c.title, icon: c.icon, byName: nameOf(taken.child_id) });
        return [];
      }
      const completion = completions.find((x) => x.chore_id === c.id && x.child_id === child.id) ?? null;
      const status: QuestStatus = completion ? completion.status : "todo";
      return [{ chore: c, status, completion }];
    })
    .sort((a, b) => order(a.status) - order(b.status) || b.chore.points - a.chore.points);

  const tomorrow = shiftDate(today, 1);
  const tomorrowPeek = mine
    .filter((c) => c.recurrence !== "once" && isChoreDueOn(c, tomorrow) && !cards.some((card) => card.chore.id === c.id && card.status === "todo"))
    .map((c) => ({ title: c.title, icon: c.icon }))
    .slice(0, 4);

  return { today, cards, tomorrowPeek, takenToday };
});

function order(s: QuestStatus) {
  return { todo: 0, rejected: 1, pending: 2, excused: 3, approved: 4 }[s];
}
