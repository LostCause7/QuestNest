"use client";

import Link from "next/link";
import { ShirtIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChildLookAvatar } from "@/components/shared/child-look";
import { LIFETIME_MILESTONES, nextMilestone } from "@/lib/milestones";
import { cn } from "@/lib/utils";
import type { Child, Family, FamilyMilestone } from "@/types/database";

export function UnlockTrack({
  child,
  family,
  extras,
}: {
  child: Child;
  family: Family;
  extras: FamilyMilestone[];
}) {
  const next = nextMilestone(child.lifetime_points, extras);

  return (
    <div className="space-y-6">
      <div className="qn-kid-surface rounded-3xl p-4 shadow-md ring-1 ring-black/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold">Lifetime unlocks</h3>
            <p className="text-sm text-muted-foreground">
              These don&apos;t cost {family.currency_name}. They open when you&apos;ve earned enough lifetime{" "}
              {family.currency_emoji} — even if you spent some.
            </p>
          </div>
          <ChildLookAvatar child={child} size="lg" />
        </div>
        {next ? (
          <p className="mt-3 text-sm font-medium">
            Next: {next.icon} {next.name} at {next.points} lifetime {family.currency_emoji} (
            {next.points - child.lifetime_points} to go)
          </p>
        ) : (
          <p className="mt-3 text-sm font-medium">Every lifetime unlock is yours. Incredible.</p>
        )}
        <Button asChild size="sm" variant="outline" className="mt-3">
          <Link href={`/kids/${child.id}/closet`}>
            <ShirtIcon className="size-4" /> Open the Closet
          </Link>
        </Button>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {[...LIFETIME_MILESTONES, ...extras.filter((e) => e.is_active).map((e) => ({
          key: `custom_${e.id}`,
          points: e.lifetime_points,
          name: e.title,
          icon: e.icon,
          title: e.title,
        }))]
          .sort((a, b) => a.points - b.points)
          .map((m) => {
            const has = child.lifetime_points >= m.points;
            return (
              <li
                key={m.key}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-card/80 px-3 py-2.5",
                  has ? "shadow-sm" : "opacity-50 grayscale"
                )}
              >
                <span className="text-2xl">{m.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.points} lifetime {family.currency_emoji}
                    {has ? " · unlocked" : ""}
                  </div>
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
