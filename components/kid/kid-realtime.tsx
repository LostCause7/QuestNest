"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { levelFromXp } from "@/lib/levels";
import { BADGE_MAP } from "@/lib/badges";
import { burst } from "@/lib/confetti";
import type { Child, ChoreCompletion, RewardRedemption, ChildBadge } from "@/types/database";

/**
 * Keeps Kid Mode live: refreshes the page when the parent approves something,
 * and celebrates level-ups and new badges as they happen.
 */
export function KidRealtime({ childId, familyId }: { childId: string; familyId: string }) {
  const router = useRouter();
  const lastLevel = useRef<number | null>(null);
  const lastStreak = useRef<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
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
            burst("big");
            toast(`Level up! You're now level ${level}`, { description: "Keep it going, hero!", duration: 6000 });
          }
          lastLevel.current = level;
          if (lastStreak.current !== null && next.current_streak > lastStreak.current && next.current_streak >= 2) {
            toast(`🔥 ${next.current_streak}-day streak!`, { description: "Come back tomorrow to keep it alive.", duration: 5000 });
          }
          lastStreak.current = next.current_streak;
          refresh();
        }
      )
      .on<ChoreCompletion>(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chore_completions", filter: `child_id=eq.${childId}` },
        (payload) => {
          const c = payload.new;
          if (c.status === "approved") {
            burst("small");
            toast.success(`Quest approved! +${c.points_awarded ?? 0}`, { duration: 5000 });
          } else if (c.status === "rejected") {
            toast(`A quest was sent back - give it another go!`, { duration: 5000 });
          }
          refresh();
        }
      )
      .on<RewardRedemption>(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reward_redemptions", filter: `child_id=eq.${childId}` },
        (payload) => {
          const r = payload.new;
          if (r.status === "fulfilled" || r.status === "approved") {
            burst("small");
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
          if (b) {
            burst("big");
            toast(`${b.emoji} New trophy: ${b.name}`, { description: b.description, duration: 6000 });
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
  }, [childId, familyId, router]);

  return null;
}
