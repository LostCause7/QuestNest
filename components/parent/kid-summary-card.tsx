import Link from "next/link";
import { FlameIcon, ChevronRightIcon } from "lucide-react";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { Progress } from "@/components/ui/progress";
import { childLook, frameClass } from "@/lib/milestones";
import { levelInfo } from "@/lib/levels";
import { colorTheme } from "@/lib/avatars";
import { cn } from "@/lib/utils";
import type { Child, Family } from "@/types/database";

export function KidSummaryCard({
  child,
  family,
  dueToday,
  doneToday,
  href,
}: {
  child: Child;
  family: Family;
  dueToday: number;
  doneToday: number;
  href?: string;
}) {
  const lvl = levelInfo(child.lifetime_points);
  const look = childLook(child.style);
  const theme = colorTheme(child.color);
  const pct = dueToday === 0 ? 100 : Math.round((doneToday / dueToday) * 100);
  const Wrapper: React.ElementType = href ? Link : "div";
  return (
    <Wrapper
      {...(href ? { href } : {})}
      className={cn(
        "qn-glass-panel qn-lift group relative flex flex-col gap-4 overflow-hidden rounded-2xl p-4",
        href && "hover:-translate-y-0.5"
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", theme.gradient)} />
      <div className="flex items-center gap-3">
        <KidAvatar
          avatar={child.avatar}
          color={child.color}
          size="md"
          sticker={look.sticker}
          hat={look.hat}
          aura={look.aura}
          frameClassName={frameClass(look.frame)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-lg font-semibold">{child.nickname?.trim() || child.name}</h3>
            {child.current_streak > 0 ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">
                <FlameIcon className="size-3" />
                {child.current_streak}
              </span>
            ) : null}
          </div>
          <div className="text-sm text-muted-foreground">
            Level {lvl.level} · {look.title || lvl.title}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-semibold tabular-nums">{child.points_balance}</div>
          <div className="text-xs text-muted-foreground">
            {family.currency_emoji} {family.currency_name}
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Today&apos;s quests</span>
          <span>
            {doneToday}/{dueToday}
          </span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>
      {href ? (
        <ChevronRightIcon className="absolute top-4 right-4 size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      ) : null}
    </Wrapper>
  );
}
