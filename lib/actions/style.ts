"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireFamily, requireUser } from "@/lib/data/family";
import { getActiveParentLook } from "@/lib/data/active-parent";
import { unlockedTitles } from "@/lib/milestones";
import { familyToday, getApprovedCounts, getBadges, getChildGifts, getFamilyMilestones, getRewards } from "@/lib/data/parent";
import { isKnownColor, isKnownFace } from "@/lib/looks-keys";
import { KID_MODE_COOKIE } from "@/lib/supabase/proxy";
import {
  closetPrice,
  findItem,
  giftKey,
  isUnlocked,
  itemsOf,
  seasonWindow,
  unlockContext,
  unlockedItems,
  type CosmeticKind,
  type UnlockContext,
} from "@/lib/cosmetics";
import { BADGE_MAP } from "@/lib/badges";
import { fail, friendlyError, guardAction, ok, type ActionResult } from "./result";
import type { Child, EquippedStyle, Family, FamilyStyle } from "@/types/database";

const MISSING = /column|schema cache|does not exist|relation/i;

async function parentHasFullAccess() {
  return (await cookies()).get(KID_MODE_COOKIE)?.value !== "1";
}

function revalidate() {
  revalidatePath("/app", "layout");
  revalidatePath("/kids", "layout");
}

async function contextFor(child: Child, family: Family) {
  const today = familyToday(family);
  const season = seasonWindow(family.created_at, today);
  const [extras, badges, gifts, counts] = await Promise.all([
    getFamilyMilestones(family.id),
    getBadges([child.id]),
    getChildGifts(child.id),
    getApprovedCounts(family.id, season.from, today < season.to ? today : season.to),
  ]);
  return { ctx: unlockContext(child, extras, badges, gifts, counts[child.id] ?? 0), extras };
}

function pick(
  kind: CosmeticKind,
  wanted: string | null | undefined,
  ctx: UnlockContext,
  fallback: string | null,
  locked: Set<string>,
  fullAccess = false
) {
  if (locked.has(kind)) return fallback;
  if (!wanted) return fallback;
  if (fullAccess && itemsOf(kind).some((item) => item.key === wanted)) return wanted;
  const allowed = unlockedItems(kind, ctx).map((i) => i.key);
  return allowed.includes(wanted) ? wanted : fallback;
}

export async function saveChildStyle(childId: string, style: EquippedStyle): Promise<ActionResult> {
  return guardAction(async () => {
    const family = await requireFamily();
    const supabase = await createClient();
    const { data: child } = await supabase.from("children").select("*").eq("id", childId).maybeSingle();
    if (!child || child.family_id !== family.id) return fail("Kid not found.");
    const { ctx, extras } = await contextFor(child as Child, family);
    const fullAccess = await parentHasFullAccess();
    const locked = new Set<string>(fullAccess ? [] : (((family.style as FamilyStyle | null)?.lockedSlots ?? []) as string[]));
    const xp = child.lifetime_points ?? 0;
    const catalogTitles = itemsOf("title").map((i) => i.label);
    const titles = fullAccess
      ? [...new Set([...unlockedTitles(xp, extras), ...catalogTitles])]
      : [...new Set([...unlockedTitles(xp, extras), ...unlockedItems("title", ctx).map((i) => i.label)])];
    const badgeKeys = [...ctx.badges].filter((k) => BADGE_MAP[k]);

    let savingFor: string | null = null;
    if (style.savingFor) {
      const rewards = await getRewards(family.id);
      savingFor = rewards.some((r) => r.id === style.savingFor && r.is_active) ? style.savingFor : null;
    }

    const next: EquippedStyle = {
      title: locked.has("title") ? titles[0] : style.title && titles.includes(style.title) ? style.title : titles[0],
      sticker: null,
      frame: pick("frame", style.frame, ctx, "none", locked, fullAccess),
      hat: null,
      aura: pick("aura", style.aura, ctx, null, locked, fullAccess),
      nameplate: pick("nameplate", style.nameplate, ctx, null, locked, fullAccess),
      banner: pick("banner", style.banner, ctx, "none", locked, fullAccess),
      room: pick("room", style.room, ctx, null, locked, fullAccess),
      soundPack: pick("soundPack", style.soundPack, ctx, null, locked, fullAccess),
      confetti: pick("confetti", style.confetti, ctx, null, locked, fullAccess),
      showcase: (style.showcase ?? []).filter((k) => badgeKeys.includes(k)).slice(0, 3),
      savingFor,
    };
    const { error } = await supabase.from("children").update({ style: next }).eq("id", childId);
    if (error && /column|schema cache|does not exist/i.test(error.message)) {
      return ok(undefined, "Saved on this device. Run the latest nest update to sync looks.");
    }
    if (error) return fail(friendlyError(error.message));
    revalidate();
    return ok(undefined, "Look saved.");
  });
}

/** Kid swaps their face or color from the Closet. Gated faces/colors must be unlocked. */
export async function saveChildLook(childId: string, input: { avatar?: string; color?: string }): Promise<ActionResult> {
  return guardAction(async () => {
    const family = await requireFamily();
    const supabase = await createClient();
    const { data: child } = await supabase.from("children").select("*").eq("id", childId).maybeSingle();
    if (!child || child.family_id !== family.id) return fail("Kid not found.");
    const { ctx } = await contextFor(child as Child, family);
    const fullAccess = await parentHasFullAccess();
    const locked = new Set<string>(fullAccess ? [] : (((family.style as FamilyStyle | null)?.lockedSlots ?? []) as string[]));
    const patch: { avatar?: string; color?: string } = {};

    if (input.avatar) {
      if (locked.has("face")) return fail("A parent locked faces for now.");
      if (!isKnownFace(input.avatar)) return fail("That face isn't in the Closet.");
      const gated = itemsOf("face").find((f) => f.key === input.avatar);
      const okFace = fullAccess || !gated || isUnlocked(gated, ctx);
      if (!okFace) return fail("That face isn't unlocked yet.");
      patch.avatar = input.avatar;
    }
    if (input.color) {
      if (locked.has("color")) return fail("A parent locked colors for now.");
      if (!isKnownColor(input.color)) return fail("That color isn't in the Closet.");
      const gated = itemsOf("color").find((c) => c.key === input.color);
      const okColor = fullAccess || !gated || isUnlocked(gated, ctx);
      if (!okColor) return fail("That color isn't unlocked yet.");
      patch.color = input.color;
    }
    if (!patch.avatar && !patch.color) return ok(undefined);

    const { error } = await supabase.from("children").update(patch).eq("id", childId);
    if (error) return fail(friendlyError(error.message));
    revalidate();
    return ok(undefined, "Look saved.");
  });
}

const buySchema = z.object({
  kind: z.enum(["face", "color", "frame", "aura", "nameplate", "banner", "title", "room", "soundPack", "confetti"]),
  key: z.string().trim().min(1).max(32),
});

/** Spend Closet Points to own a locked look. Existing unlock paths still work. */
export async function buyClosetItem(
  childId: string,
  input: { kind: CosmeticKind; key: string }
): Promise<ActionResult<{ closet_points: number }>> {
  return guardAction(async () => {
    const parsed = buySchema.safeParse(input);
    if (!parsed.success) return fail("Pick something from the Closet catalog.");
    const item = findItem(parsed.data.kind, parsed.data.key);
    if (!item) return fail("That look isn't in the Closet.");
    const cost = closetPrice(item);
    if (cost < 1) return fail("That look is already free.");

    const family = await requireFamily();
    const supabase = await createClient();
    const { data: child } = await supabase.from("children").select("*").eq("id", childId).maybeSingle();
    if (!child || child.family_id !== family.id) return fail("Kid not found.");

    const { ctx } = await contextFor(child as Child, family);
    if (isUnlocked(item, ctx)) return fail("You already have that look.");

    const { data, error } = await supabase.rpc("buy_closet_item", {
      p_child: childId,
      p_item_key: giftKey(item),
      p_cost: cost,
    });
    if (error) {
      if (MISSING.test(error.message)) return fail("Closet Points need the latest nest update in Supabase (0014).");
      return fail(friendlyError(error.message));
    }
    revalidate();
    return ok({ closet_points: typeof data === "number" ? data : Math.max(0, (child.closet_points ?? 0) - cost) }, `Bought ${item.label}!`);
  });
}

export async function saveChildFlavor(childId: string, input: { nickname?: string | null; motto?: string | null }): Promise<ActionResult> {
  return guardAction(async () => {
    const parsed = z
      .object({
        nickname: z.string().trim().max(24).optional().nullable(),
        motto: z.string().trim().max(80).optional().nullable(),
      })
      .safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid.");
    await requireFamily();
    const supabase = await createClient();
    const { error } = await supabase.from("children").update(parsed.data).eq("id", childId);
    if (error && /column|schema cache|does not exist/i.test(error.message)) {
      return ok(undefined, "Saved later after the nest update.");
    }
    if (error) return fail(friendlyError(error.message));
    revalidate();
    return ok(undefined, "Saved.");
  });
}

export async function saveParentLook(input: {
  name: string;
  motto?: string | null;
  avatar_key?: string | null;
  color_key?: string | null;
}): Promise<ActionResult> {
  return guardAction(async () => {
    const parsed = z
      .object({
        name: z.string().trim().min(1).max(60),
        motto: z.string().trim().max(80).optional().nullable(),
        avatar_key: z.string().optional().nullable(),
        color_key: z.string().optional().nullable(),
      })
      .safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid.");
    if (parsed.data.avatar_key && !isKnownFace(parsed.data.avatar_key)) {
      return fail("Pick a nest avatar.");
    }
    if (parsed.data.color_key && !isKnownColor(parsed.data.color_key)) {
      return fail("Pick a nest color.");
    }
    const user = await requireUser();
    const family = await requireFamily();
    const supabase = await createClient();
    const active = await getActiveParentLook(family.id);
    if (active.source === "extra") {
      const { error } = await supabase
        .from("parent_profiles")
        .update({
          name: parsed.data.name,
          motto: parsed.data.motto || null,
          avatar: parsed.data.avatar_key || "luna",
          color: parsed.data.color_key || "sky",
        })
        .eq("id", active.id)
        .eq("family_id", family.id);
      if (error) return fail(friendlyError(error.message));
      revalidate();
      return ok(undefined, "Look saved.");
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: parsed.data.name,
        motto: parsed.data.motto || null,
        avatar_key: parsed.data.avatar_key || null,
        color_key: parsed.data.color_key || null,
      })
      .eq("id", user.id);
    if (error && /column|schema cache|does not exist/i.test(error.message)) {
      const { error: nameErr } = await supabase.from("profiles").update({ display_name: parsed.data.name }).eq("id", user.id);
      if (nameErr) return fail(friendlyError(nameErr.message));
      return ok(undefined, "Name saved. Extra look fields need the nest update.");
    }
    if (error) return fail(friendlyError(error.message));
    revalidate();
    return ok(undefined, "Look saved.");
  });
}

export async function upsertFamilyMilestone(input: {
  id?: string;
  lifetime_points: number;
  title: string;
  icon: string;
}): Promise<ActionResult> {
  return guardAction(async () => {
    const parsed = z
      .object({
        id: z.uuid().optional(),
        lifetime_points: z.number().int().min(1).max(1_000_000),
        title: z.string().trim().min(1).max(40),
        icon: z.string().trim().min(1).max(8),
      })
      .safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid.");
    const family = await requireFamily();
    const supabase = await createClient();
    const row = {
      family_id: family.id,
      lifetime_points: parsed.data.lifetime_points,
      title: parsed.data.title,
      icon: parsed.data.icon,
      is_active: true,
    };
    const query = parsed.data.id
      ? supabase.from("family_milestones").update(row).eq("id", parsed.data.id).eq("family_id", family.id)
      : supabase.from("family_milestones").insert(row);
    const { error } = await query;
    if (error && /does not exist|schema cache/i.test(error.message)) {
      return fail("Custom unlocks need the latest nest update in Supabase.");
    }
    if (error) return fail(friendlyError(error.message));
    revalidate();
    return ok(undefined, "Unlock saved.");
  });
}

export async function deleteFamilyMilestone(id: string): Promise<ActionResult> {
  return guardAction(async () => {
    const family = await requireFamily();
    const supabase = await createClient();
    const { error } = await supabase.from("family_milestones").delete().eq("id", id).eq("family_id", family.id);
    if (error && /does not exist|schema cache/i.test(error.message)) return fail("Custom unlocks need the latest nest update.");
    if (error) return fail(friendlyError(error.message));
    revalidate();
    return ok(undefined, "Unlock removed.");
  });
}
