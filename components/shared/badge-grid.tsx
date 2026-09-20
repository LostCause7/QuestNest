import { BADGES } from "@/lib/badges";
import { cn } from "@/lib/utils";
import type { ChildBadge } from "@/types/database";

const TIER_STYLES = {
  bronze: "from-amber-200 to-orange-300",
  silver: "from-slate-200 to-slate-400",
  gold: "from-yellow-200 to-amber-400",
};

export function BadgeGrid({ earned, size = "md" }: { earned: ChildBadge[]; size?: "sm" | "md" }) {
  const earnedKeys = new Set(earned.map((b) => b.badge_key));
  return (
    <ul className={cn("grid gap-3", size === "sm" ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6")}>
      {BADGES.map((b) => {
        const has = earnedKeys.has(b.key);
        return (
          <li
            key={b.key}
            className={cn(
              "flex flex-col items-center rounded-2xl border p-3 text-center transition-all",
              has ? "bg-card shadow-sm" : "border-dashed bg-muted/40 opacity-60 grayscale"
            )}
            title={b.description}
          >
            <span
              className={cn(
                "flex items-center justify-center rounded-full bg-gradient-to-br",
                size === "sm" ? "size-10 text-xl" : "size-14 text-3xl",
                has ? TIER_STYLES[b.tier] : "from-muted to-muted"
              )}
            >
              {b.emoji}
            </span>
            <span className={cn("mt-2 font-medium leading-tight", size === "sm" ? "text-[11px]" : "text-sm")}>{b.name}</span>
            {size === "md" ? <span className="mt-0.5 text-[11px] text-muted-foreground">{has ? "Earned" : b.description}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}
