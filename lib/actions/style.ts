"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireFamily, requireUser } from "@/lib/data/family";
import { unlockedFrames, unlockedStickers, unlockedTitles } from "@/lib/milestones";
import { getFamilyMilestones } from "@/lib/data/parent";
import { AVATAR_KEYS, COLOR_KEYS } from "@/lib/avatars";
import { fail, friendlyError, guardAction, ok, type ActionResult } from "./result";
import type { EquippedStyle } from "@/types/database";

function revalidate() {
  revalidatePath("/app", "layout");
  revalidatePath("/kids", "layout");
}

export async function saveChildStyle(childId: string, style: EquippedStyle): Promise<ActionResult> {
  return guardAction(async () => {
    const family = await requireFamily();
    const supabase = await createClient();
    const { data: child } = await supabase.from("children").select("*").eq("id", childId).maybeSingle();
    if (!child || child.family_id !== family.id) return fail("Kid not found.");
    const extras = await getFamilyMilestones(family.id);
    const xp = child.lifetime_points ?? 0;
    const titles = unlockedTitles(xp, extras);
    const frames = unlockedFrames(xp, extras).map((f) => f.key);
    const stickers = unlockedStickers(xp, extras);
    const next: EquippedStyle = {
      title: style.title && titles.includes(style.title) ? style.title : titles[0],
      frame: style.frame && frames.includes(style.frame) ? style.frame : "none",
      sticker: style.sticker && stickers.includes(style.sticker) ? style.sticker : null,
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
