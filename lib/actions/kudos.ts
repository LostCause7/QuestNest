"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireFamily } from "@/lib/data/family";
import { findItem, giftKey, type CosmeticKind } from "@/lib/cosmetics";
import { ok, fail, friendlyError, guardAction, type ActionResult } from "./result";

const MISSING = /column|schema cache|does not exist|relation/i;

function revalidate() {
  revalidatePath("/app", "layout");
  revalidatePath("/kids", "layout");
}

async function ownChild(childId: string) {
  const family = await requireFamily();
  const supabase = await createClient();
  const { data } = await supabase.from("children").select("id").eq("id", childId).eq("family_id", family.id).maybeSingle();
  return data ? { family, supabase } : null;
}

const kudosSchema = z.object({
  emoji: z.string().trim().min(1).max(8),
  message: z.string().trim().max(120).optional().nullable(),
});

/** One-tap parent kudos. Shows as a sticky note on the kid's screen for 24h and celebrates live. Needs 0009. */
export async function sendKudos(childId: string, input: { emoji: string; message?: string | null }): Promise<ActionResult> {
  return guardAction(async () => {
    const parsed = kudosSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid kudos.");
    const owned = await ownChild(childId);
    if (!owned) return fail("Kid not found.");
    const { family, supabase } = owned;
    const { data: claims } = await supabase.auth.getClaims();
    const { error } = await supabase.from("child_kudos").insert({
      family_id: family.id,
      child_id: childId,
      emoji: parsed.data.emoji,
      message: parsed.data.message?.trim() || null,
      created_by: claims?.claims.sub ?? null,
    });
    if (error) {
      if (MISSING.test(error.message)) return fail("Kudos need the latest nest update (0009).");
      return fail(friendlyError(error.message));
    }
    revalidate();
    return ok(undefined, "Kudos sent!");
  });
}

const giftSchema = z.object({
  kind: z.enum(["face", "color", "frame", "aura", "nameplate", "banner", "title", "room", "soundPack", "confetti"]),
  key: z.string().trim().min(1).max(32),
});

/** Parent gifts a Closet item the kid hasn't earned yet. Needs 0009. */
export async function giftLook(childId: string, input: { kind: CosmeticKind; key: string }): Promise<ActionResult> {
  return guardAction(async () => {
    const parsed = giftSchema.safeParse(input);
    if (!parsed.success) return fail("Pick something from the Closet catalog.");
    const item = findItem(parsed.data.kind, parsed.data.key);
    if (!item) return fail("That look isn't in the catalog.");
    const owned = await ownChild(childId);
    if (!owned) return fail("Kid not found.");
    const { family, supabase } = owned;
    const { error } = await supabase
      .from("child_unlock_gifts")
      .upsert({ family_id: family.id, child_id: childId, item_key: giftKey(item) }, { onConflict: "child_id,item_key" });
    if (error) {
      if (MISSING.test(error.message)) return fail("Gifting looks needs the latest nest update (0009).");
      return fail(friendlyError(error.message));
    }
    revalidate();
    return ok(undefined, `Gifted ${item.label}.`);
  });
}

export async function ungiftLook(childId: string, itemKey: string): Promise<ActionResult> {
  return guardAction(async () => {
    const owned = await ownChild(childId);
    if (!owned) return fail("Kid not found.");
    const { error } = await owned.supabase.from("child_unlock_gifts").delete().eq("child_id", childId).eq("item_key", itemKey);
    if (error) return fail(friendlyError(error.message));
    revalidate();
    return ok(undefined, "Gift removed.");
  });
}
