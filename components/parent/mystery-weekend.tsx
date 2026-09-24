"use client";

import { useMemo, useState } from "react";
import { DicesIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { createChore } from "@/lib/actions/chores";
import { CHORE_PACKS, EXTRA_CHORE_PACKS, type ChoreTemplate } from "@/lib/templates";
import type { Child, Family } from "@/types/database";

/**
 * Saturday/Sunday only: suggests a one-off quest the nest hasn't used yet.
 * One tap creates it for every active kid. Parent HQ only.
 */
export function MysteryWeekend({
  family,
  kids,
  existingTitles,
  hasOnceToday,
  today,
}: {
  family: Family;
  kids: Child[];
  existingTitles: string[];
  hasOnceToday: boolean;
  today: string;
}) {
  const { run, pending } = useAction();
  const [seed, setSeed] = useState(0);
  const dow = new Date(today + "T00:00:00Z").getUTCDay();
  const weekend = dow === 0 || dow === 6;

  const pool = useMemo(() => {
    const used = new Set(existingTitles.map((t) => t.toLowerCase()));
    const all: ChoreTemplate[] = [...Object.values(CHORE_PACKS).flat(), ...EXTRA_CHORE_PACKS.flatMap((p) => p.items)];
    const seen = new Set<string>();
    return all.filter((t) => {
      const k = t.title.toLowerCase();
      if (used.has(k) || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [existingTitles]);

  if (!weekend || hasOnceToday || !kids.length || !pool.length) return null;

  let h = 0;
  for (const ch of today + seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pickIdx = h % pool.length;
  const suggestion = pool[pickIdx];
  const points = Math.max(5, Math.round(suggestion.points * 1.5));

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-dashed border-violet-300 bg-violet-50/70 p-4 sm:flex-row sm:items-center">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-2xl">
        <DicesIcon className="size-6 text-violet-600" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-violet-700">Mystery weekend quest</div>
        <div className="font-display text-lg font-semibold">
          {suggestion.icon} {suggestion.title} · +{points} {family.currency_emoji}
        </div>
        <p className="text-xs text-muted-foreground">A one-time bonus quest for today, for every kid. Worth 1.5x the usual.</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="ghost" size="sm" onClick={() => setSeed((s) => s + 1)} aria-label="Different suggestion">
          <RefreshCwIcon className="size-4" />
        </Button>
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            run(() =>
              createChore({
                title: suggestion.title,
                description: suggestion.description ?? "Mystery weekend quest!",
                icon: suggestion.icon,
                points,
                recurrence: "once",
                days_of_week: [0, 1, 2, 3, 4, 5, 6],
                requires_approval: suggestion.requires_approval ?? true,
                kind: "quest",
                child_ids: kids.map((k) => k.id),
              })
            )
          }
        >
          {pending ? <Loader2Icon className="animate-spin" /> : <DicesIcon />}
          Post it
        </Button>
      </div>
    </section>
  );
}
