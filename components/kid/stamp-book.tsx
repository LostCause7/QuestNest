"use client";

import { PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChildDayAward, ChoreCompletion } from "@/types/database";

const AWARD_STAMP: Record<string, string> = {
  perfect_day: "🌅",
  combo: "⚡",
  mystery: "🎲",
  comeback: "👋",
  daily: "🌟",
};

/**
 * Last 28 days as a stamp book: one square per day with a stamp for each
 * finished quest and special awards. Prints nicely for the fridge.
 */
export function StampBook({
  name,
  today,
  completions,
  awards,
  currencyEmoji,
}: {
  name: string;
  today: string;
  completions: ChoreCompletion[];
  awards: ChildDayAward[];
  currencyEmoji: string;
}) {
  const days: string[] = [];
  const end = new Date(today + "T00:00:00Z").getTime();
  for (let i = 27; i >= 0; i--) days.push(new Date(end - i * 86_400_000).toISOString().slice(0, 10));

  const byDay = new Map<string, { done: number; points: number; awards: string[] }>();
  for (const d of days) byDay.set(d, { done: 0, points: 0, awards: [] });
  for (const c of completions) {
    if (c.status !== "approved") continue;
    const row = byDay.get(c.for_date);
    if (row) {
      row.done += 1;
      row.points += c.points_awarded ?? 0;
    }
  }
  for (const a of awards) byDay.get(a.for_date)?.awards.push(a.kind);

  const totalDone = [...byDay.values()].reduce((s, r) => s + r.done, 0);

  return (
    <div className="qn-kid-surface rounded-3xl p-4 shadow-md ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-xl font-semibold">Stamp book</h3>
          <p className="text-sm text-muted-foreground">
            {name}&apos;s last four weeks · {totalDone} quest{totalDone === 1 ? "" : "s"} stamped
          </p>
        </div>
        <Button variant="outline" size="sm" className="qn-no-print" onClick={() => window.print()}>
          <PrinterIcon className="size-4" /> Print
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground">
            {d}
          </div>
        ))}
        {/* pad so the first day lands on its weekday */}
        {Array.from({ length: new Date(days[0] + "T00:00:00Z").getUTCDay() }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((d) => {
          const row = byDay.get(d)!;
          const isToday = d === today;
          return (
            <div
              key={d}
              title={`${d}: ${row.done} quests, +${row.points} ${currencyEmoji}`}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-xl border text-center",
                row.done > 0 ? "border-emerald-300 bg-emerald-50" : "border-dashed bg-muted/40",
                isToday && "ring-2 ring-primary"
              )}
            >
              <div className="text-[10px] text-muted-foreground">{Number(d.slice(8, 10))}</div>
              <div className="text-base leading-none">
                {row.awards.length ? AWARD_STAMP[row.awards[0]] ?? "⭐" : row.done > 0 ? "✅" : ""}
              </div>
              {row.done > 1 ? <div className="text-[9px] font-semibold text-emerald-700">×{row.done}</div> : null}
            </div>
          );
        })}
      </div>
      <p className="qn-print-only mt-3 text-xs">ChoreHall · printed stamp book</p>
    </div>
  );
}
