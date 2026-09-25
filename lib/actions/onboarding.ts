"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ALL_COLOR_KEYS, ALL_FACE_KEYS } from "@/lib/looks-keys";

const schema = z.object({
  familyName: z.string().trim().min(1, "Give your nest a name.").max(60),
  currencyName: z.string().trim().min(1).max(20),
  currencyEmoji: z.string().trim().min(1).max(8),
  timezone: z.string().min(1).max(64),
  child: z.object({
    name: z.string().trim().min(1, "What's your kid's name?").max(40),
    avatar: z.enum(ALL_FACE_KEYS as [string, ...string[]]),
    color: z.enum(ALL_COLOR_KEYS as [string, ...string[]]),
    pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits."),
  }),
  chores: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(80),
        icon: z.string().min(1).max(8),
        points: z.number().int().min(0).max(10000),
        recurrence: z.enum(["once", "daily", "weekly", "custom"]),
        days_of_week: z.array(z.number().int().min(0).max(6)).optional(),
        requires_approval: z.boolean().optional(),
      })
    )
    .max(50),
  rewards: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(80),
        icon: z.string().min(1).max(8),
        cost: z.number().int().min(0).max(100000),
        category: z.enum(["privilege", "item", "experience"]),
      })
    )
    .max(50),
});

export type OnboardingInput = z.infer<typeof schema>;

export async function completeOnboarding(input: OnboardingInput): Promise<{ error?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) redirect("/login");

  // Guard: already onboarded
  const { data: existing } = await supabase.from("families").select("id").limit(1).maybeSingle();
  if (existing) redirect("/app");

  const familyId = crypto.randomUUID();
  const { error: famErr } = await supabase.from("families").insert({
    id: familyId,
    name: data.familyName,
    owner_id: userId,
    currency_name: data.currencyName,
    currency_emoji: data.currencyEmoji,
    timezone: data.timezone,
  });
  if (famErr) return { error: famErr.message };

  const { data: child, error: childErr } = await supabase
    .from("children")
    .insert({
      family_id: familyId,
      name: data.child.name,
      avatar: data.child.avatar,
      color: data.child.color,
    })
    .select()
    .single();
  if (childErr || !child) return { error: childErr?.message ?? "Could not add your kid." };

  const { error: pinErr } = await supabase.rpc("set_child_pin", { p_child: child.id, p_pin: data.child.pin });
  if (pinErr) return { error: pinErr.message };

  if (data.chores.length) {
    const { data: chores, error: choreErr } = await supabase
      .from("chores")
      .insert(
        data.chores.map((c) => ({
          family_id: familyId,
          title: c.title,
          icon: c.icon,
          points: c.points,
          recurrence: c.recurrence,
          days_of_week: c.days_of_week ?? [0, 1, 2, 3, 4, 5, 6],
          requires_approval: c.requires_approval ?? true,
        }))
      )
      .select("id");
    if (choreErr) return { error: choreErr.message };
    if (chores?.length) {
      const { error: asgErr } = await supabase
        .from("chore_assignments")
        .insert(chores.map((c) => ({ chore_id: c.id, child_id: child.id })));
      if (asgErr) return { error: asgErr.message };
    }
  }

  if (data.rewards.length) {
    const { error: rewardErr } = await supabase.from("rewards").insert(
      data.rewards.map((r) => ({
        family_id: familyId,
        title: r.title,
        icon: r.icon,
        cost: r.cost,
        category: r.category,
      }))
    );
    if (rewardErr) return { error: rewardErr.message };
  }

  redirect("/app?welcome=1");
}
