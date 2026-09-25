"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { levelFromXp } from "@/lib/levels";
import { BADGE_MAP } from "@/lib/badges";
import { celebrate } from "@/lib/celebrate";
import { play } from "@/lib/sound";
import { KUDOS_LINES, STREAK_LINES, pick } from "@/lib/copy";
import type { Child, ChoreCompletion, RewardRedemption, ChildBadge, ChildKudos, ChildDayAward } from "@/types/database";

/**
 * Keeps Kid Mode live: refreshes the page when the parent approves something,
 * and celebrates level-ups, streaks, badges, kudos and daily awards as they happen.
 */
export function KidRealtime({
  childId,
  familyId,
  siblings = [],
  currencyEmoji = "⭐",
}: {
  childId: string;
  familyId: string;
  siblings?: { id: string; name: string }[];
  currencyEmoji?: string;
}) {
  const router = useRouter();
  const lastLevel = useRef<number | null>(null);
  const lastStreak = useRef<number | null>(null);
  const siblingsKey = JSON.stringify(siblings);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    const siblingMap = new Map((JSON.parse(siblingsKey) as { id: string; name: string }[]).map((s) => [s.id, s.name]));
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => router.refresh(), 150);
    };

    const channel = supabase
      .channel(`kid-${childId}`)
      .on<Child>(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "children", filter: `id=eq.${childId}` },
        (payload) => {
          const next = payload.new;
          const level = levelFromXp(next.lifetime_points);
          if (lastLevel.current !== null && level > lastLevel.current) {
            celebrate({ emoji: "🆙", title: `Level ${level}!`, subtitle: "Keep it going, hero!", tone: "level" });
          }
          lastLevel.current = level;
          if (lastStreak.current !== null && next.current_streak > lastStreak.current && next.current_streak >= 2) {
            celebrate({
              emoji: "🔥",
              title: `${next.current_streak}-day streak!`,
              subtitle: pick(STREAK_LINES, String(next.current_streak)),
              tone: "streak",
              quiet: next.current_streak % 7 !== 0 && next.current_streak !== 3,
            });
            if (next.current_streak % 7 !== 0 && next.current_streak !== 3) {
              toast(`🔥 ${next.current_streak}-day streak!`, { description: pick(STREAK_LINES, String(next.current_streak)), duration: 5000 });
            }
          }
          lastStreak.current = next.current_streak;
          refresh();
        }
      )
      .on<ChoreCompletion>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chore_completions", filter: `family_id=eq.${familyId}` },
        (payload) => {
          if (payload.new.child_id !== childId) refresh();
        }
      )
      .on<ChoreCompletion>(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chore_completions", filter: `child_id=eq.${childId}` },
        (payload) => {
          const c = payload.new;
          if (c.status === "approved") {
            play("approved");
            celebrate({
              emoji: "✅",
              title: "Quest approved!",
              points: c.points_awarded ?? 0,
              currencyEmoji,
              tone: "gold",
              quiet: true,
            });
            toast.success(`Quest approved! +${c.points_awarded ?? 0} ${currencyEmoji}`, { duration: 5000 });
          } else if (c.status === "excused") {
            toast("A parent said you can skip that quest today.", { duration: 5000 });
          } else if (c.status === "rejected") {
            play("error");
            toast(`A quest was sent back - give it another go!`, { duration: 5000 });
          }
          refresh();
        }
      )
      .on<ChoreCompletion>(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chore_completions", filter: `family_id=eq.${familyId}` },
        (payload) => {
          const c = payload.new;
          if (c.child_id === childId || c.status !== "approved") return;
          const name = siblingMap.get(c.child_id);
          if (!name) return;
          toast(`👏 ${name} finished a quest!`, { description: "Give them a high five.", duration: 4000 });
        }
      )
      .on<RewardRedemption>(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reward_redemptions", filter: `child_id=eq.${childId}` },
        (payload) => {
          const r = payload.new;
          if (r.status === "fulfilled" || r.status === "approved") {
            play("purchase");
            celebrate({ emoji: "🎁", title: "Your reward is on its way!", tone: "shop", quiet: true });
            toast.success("Your reward is on its way!", { duration: 5000 });
          } else if (r.status === "rejected") {
            toast("That reward was declined. Your points are back!", { duration: 5000 });
          }
          refresh();
        }
      )
      .on<ChildBadge>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "child_badges", filter: `child_id=eq.${childId}` },
        (payload) => {
          const b = BADGE_MAP[payload.new.badge_key];
          if (b) celebrate({ emoji: b.emoji, title: `New trophy: ${b.name}`, subtitle: b.description, tone: "badge" });
          refresh();
        }
      )
      .on<ChildKudos>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "child_kudos", filter: `child_id=eq.${childId}` },
        (payload) => {
          const k = payload.new;
          celebrate({
            emoji: k.emoji || "💖",
            title: k.message?.trim() || pick(KUDOS_LINES, k.id),
            subtitle: "A parent sent you kudos.",
            tone: "kudos",
          });
          refresh();
        }
      )
      .on<ChildDayAward>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "child_day_awards", filter: `child_id=eq.${childId}` },
        (payload) => {
          const a = payload.new;
          if (a.kind === "perfect_day") {
            celebrate({ emoji: "🌅", title: "Perfect day!", subtitle: "Every quest done. Take a bow.", points: a.points, currencyEmoji, tone: "sunrise" });
          } else if (a.kind === "mystery") {
            celebrate({ emoji: "🎲", title: "Double points!", subtitle: "Surprise! This quest paid twice.", points: a.points, currencyEmoji, tone: "gold" });
          } else if (a.kind === "comeback") {
            celebrate({ emoji: "👋", title: "Welcome back!", subtitle: "We missed you. Bonus for showing up.", points: a.points, currencyEmoji, tone: "comeback" });
          } else if (a.kind === "daily") {
            toast(`Daily bonus +${a.points} ${currencyEmoji}`, { duration: 4000 });
          }
          refresh();
        }
      )
      .subscribe();

    // Seed the level so we can detect the first level-up.
    supabase
      .from("children")
      .select("lifetime_points, current_streak")
      .eq("id", childId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (lastLevel.current === null) lastLevel.current = levelFromXp(data.lifetime_points);
        if (lastStreak.current === null) lastStreak.current = data.current_streak;
      });

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, [childId, familyId, router, currencyEmoji, siblingsKey]);

  return null;
}
