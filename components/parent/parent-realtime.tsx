"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { inQuietHours, readPrefs } from "@/lib/prefs";
import type { ChoreCompletion, RewardRedemption } from "@/types/database";

/**
 * Parent HQ stays live: new submissions from Kid Mode pop a toast and refresh
 * the approval queue without a reload.
 */
export function ParentRealtime({ familyId }: { familyId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 200);
    };

    const nameOf = async (table: "chores" | "rewards", id: string) => {
      const { data } = await supabase.from(table).select("title").eq("id", id).maybeSingle();
      return data?.title;
    };
    const kidName = async (id: string) => {
      const { data } = await supabase.from("children").select("name").eq("id", id).maybeSingle();
      return data?.name ?? "Someone";
    };

    const channel = supabase
      .channel(`family-${familyId}`)
      .on<ChoreCompletion>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chore_completions", filter: `family_id=eq.${familyId}` },
        async (payload) => {
          const c = payload.new;
          refresh();
          if (c.status !== "pending") return;
          if (inQuietHours(readPrefs())) return;
          const [kid, chore] = await Promise.all([kidName(c.child_id), nameOf("chores", c.chore_id)]);
          toast(c.excuse ? `${kid} can't do “${chore ?? "a quest"}” today` : `${kid} finished “${chore ?? "a quest"}”`, {
            description: c.excuse ? "Confirm the skip so they aren't penalized." : "Waiting for your approval.",
            action: { label: "Review", onClick: () => router.push("/app") },
            duration: 8000,
          });
        }
      )
      .on<RewardRedemption>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reward_redemptions", filter: `family_id=eq.${familyId}` },
        async (payload) => {
          const r = payload.new;
          refresh();
          const [kid, reward] = await Promise.all([kidName(r.child_id), nameOf("rewards", r.reward_id)]);
          toast(`${kid} redeemed “${reward ?? "a reward"}”`, {
            description: r.status === "pending" ? "Approve or decline on the dashboard." : "Time to deliver!",
            action: { label: "View", onClick: () => router.push("/app/rewards") },
            duration: 8000,
          });
        }
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "children", filter: `family_id=eq.${familyId}` }, refresh)
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [familyId, router]);

  return null;
}
