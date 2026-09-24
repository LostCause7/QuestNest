import { BADGE_MAP, BADGE_SETS } from "@/lib/badges";
import { cn } from "@/lib/utils";

/** Trophy sets: collect every badge in a set to unlock a Closet look. */
export function BadgeSets({ earned }: { earned: Set<string> }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {BADGE_SETS.map((set) => {
        const have = set.badgeKeys.filter((k) => earned.has(k)).length;
        const done = have === set.badgeKeys.length;
        return (
          <li key={set.key} className={cn("rounded-2xl border bg-card/80 p-3", done && "border-amber-300 bg-amber-50/70 qn-foil")}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{set.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display font-semibold">{set.name}</div>
                <div className="text-xs text-muted-foreground">
                  {done ? `Complete · unlocked ${set.reward}` : `${have}/${set.badgeKeys.length} · unlocks ${set.reward}`}
                </div>
              </div>
            </div>
            <div className="mt-2 flex gap-1.5">
              {set.badgeKeys.map((k) => {
                const b = BADGE_MAP[k];
                const has = earned.has(k);
                return (
                  <span
                    key={k}
                    title={b ? `${b.name} — ${b.description}` : k}
                    className={cn("flex size-9 items-center justify-center rounded-full bg-muted text-lg", !has && "opacity-40 grayscale")}
                  >
                    {b?.emoji ?? "?"}
                  </span>
                );
              })}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
