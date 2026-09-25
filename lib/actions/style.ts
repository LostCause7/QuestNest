"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireFamily, requireUser } from "@/lib/data/family";
import { unlockedTitles } from "@/lib/milestones";
import { familyToday, getApprovedCounts, getBadges, getChildGifts, getFamilyMilestones, getRewards } from "@/lib/data/parent";
import { AVATAR_KEYS, COLOR_KEYS } from "@/lib/avatars";
import {
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

function pick(kind: CosmeticKind, wanted: string | null | undefined, ctx: UnlockContext, fallback: string | null, locked: Set<string>) {
  if (locked.has(kind)) return fallback;
  if (!wanted) return fallback;
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
    const locked = new Set<string>(((family.style as FamilyStyle | null)?.lockedSlots ?? []) as string[]);
    const xp = child.lifetime_points ?? 0;
    const titles = [...new Set([...unlockedTitles(xp, extras), ...unlockedItems("title", ctx).map((i) => i.label)])];
    const badgeKeys = [...ctx.badges].filter((k) => BADGE_MAP[k]);

    let savingFor: string | null = null;
    if (style.savingFor) {
      const rewards = await getRewards(family.id);
      savingFor = rewards.some((r) => r.id === style.savingFor && r.is_active) ? style.savingFor : null;
    }

    const next: EquippedStyle = {
      title: locked.has("title") ? titles[0] : style.title && titles.includes(style.title) ? style.title : titles[0],
      sticker: null,
      frame: pick("frame", style.frame, ctx, "none", locked),
      hat: null,
      aura: pick("aura", style.aura, ctx, null, locked),
      nameplate: pick("nameplate", style.nameplate, ctx, null, locked),
      banner: pick("banner", style.banner, ctx, "none", locked),
      room: pick("room", style.room, ctx, null, locked),
      soundPack: pick("soundPack", style.soundPack, ctx, null, locked),
      confetti: pick("confetti", style.confetti, ctx, null, locked),
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
    const locked = new Set<string>(((family.style as FamilyStyle | null)?.lockedSlots ?? []) as string[]);
    const patch: { avatar?: string; color?: string } = {};

    if (input.avatar) {
      if (locked.has("face")) return fail("A parent locked faces for now.");
      const gated = itemsOf("face").find((f) => f.key === input.avatar);
      const okFace = AVATAR_KEYS.includes(input.avatar as (typeof AVATAR_KEYS)[number]) || (gated && isUnlocked(gated, ctx));
      if (!okFace) return fail("That face isn't unlocked yet.");
      patch.avatar = input.avatar;
    }
    if (input.color) {
      if (locked.has("color")) return fail("A parent locked colors for now.");
      const gated = itemsOf("color").find((c) => c.key === input.color);
      const okColor = COLOR_KEYS.includes(input.color as (typeof COLOR_KEYS)[number]) || (gated && isUnlocked(gated, ctx));
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
    if (parsed.data.avatar_key && !AVATAR_KEYS.includes(parsed.data.avatar_key as (typeof AVATAR_KEYS)[number])) {
      return fail("Pick a nest avatar.");
    }
    if (parsed.data.color_key && !COLOR_KEYS.includes(parsed.data.color_key as (typeof COLOR_KEYS)[number])) {
      return fail("Pick a nest color.");
    }
    const user = await requireUser();
    const supabase = await createClient();
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
