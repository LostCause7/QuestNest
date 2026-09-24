"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireFamily } from "@/lib/data/family";
import { familyToday, getApprovedCounts } from "@/lib/data/parent";
import { SEASON_NODES, giftKey, seasonWindow } from "@/lib/cosmetics";
import { ok, fail, friendlyError, guardAction, type ActionResult } from "./result";

/**
 * Claims a season-pass node the kid has reached. Claiming writes a gift row so
 * the look stays unlocked after the season rolls over. Needs 0009; without it
 * the item still works for the rest of the season via the live count.
 */
export async function claimSeasonReward(childId: string, nodeIndex: number): Promise<ActionResult> {
  return guardAction(async () => {
    const node = SEASON_NODES[nodeIndex];
    if (!node) return fail("That reward doesn't exist.");
    const family = await requireFamily();
    const supabase = await createClient();
    const { data: child } = await supabase.from("children").select("id").eq("id", childId).eq("family_id", family.id).maybeSingle();
    if (!child) return fail("Kid not found.");

    const today = familyToday(family);
    const season = seasonWindow(family.created_at, today);
    const counts = await getApprovedCounts(family.id, season.from, today);
    if ((counts[childId] ?? 0) < node.quests) return fail(`Finish ${node.quests} quests this season first.`);

    const { error } = await supabase
      .from("child_unlock_gifts")
      .upsert({ family_id: family.id, child_id: childId, item_key: giftKey(node.item) }, { onConflict: "child_id,item_key" });
    if (error) {
      if (/column|schema cache|does not exist|relation/i.test(error.message)) {
        return ok(undefined, `${node.item.label} is yours for this season. Ask a parent to run the latest nest update to keep it forever.`);
      }
      return fail(friendlyError(error.message));
    }
    revalidatePath("/kids", "layout");
    return ok(undefined, `${node.item.label} is yours to keep!`);
  });
}
