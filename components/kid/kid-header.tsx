"use client";

import { FlameIcon, UsersIcon } from "lucide-react";
import { motion } from "framer-motion";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { levelInfo } from "@/lib/levels";
import { childLook, frameClass } from "@/lib/milestones";
import { switchChild } from "@/lib/actions/kid-mode";
import { cn } from "@/lib/utils";
import type { Child, Family } from "@/types/database";

export function KidHeader({ child, family }: { child: Child; family: Family }) {
  const lvl = levelInfo(child.lifetime_points);
  const look = childLook(child.style);
  const shownName = child.nickname?.trim() || child.name;
  return (
    <header className="mx-auto w-full max-w-3xl px-4 pt-4 sm:px-6">
      <div className="flex items-center gap-3 rounded-3xl bg-card/80 p-3 shadow-sm backdrop-blur sm:gap-4 sm:p-4">
        <span className="relative">
          <KidAvatar
            avatar={child.avatar}
            color={child.color}
            size="md"
            sticker={look.sticker}
            frameClassName={frameClass(look.frame)}
            className="shadow-md sm:size-16 sm:text-4xl"
          />
          <span className="absolute -right-1 -bottom-1 rounded-full bg-card px-1 text-[10px] font-bold shadow-sm" title={lvl.title}>
            {lvl.level < 3 ? "🐣" : lvl.level < 6 ? "🐥" : lvl.level < 10 ? "🐦" : "🦅"}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-xl font-semibold sm:text-2xl">{shownName}</h1>
            {child.current_streak > 0 ? (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600"
              >
                <FlameIcon className="size-3.5" />
                {child.current_streak} day{child.current_streak === 1 ? "" : "s"}
              </motion.span>
            ) : null}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="shrink-0 text-xs font-semibold text-muted-foreground">
              Lv {lvl.level} · {look.title || lvl.title}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-nest-400 to-nest-600"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(4, lvl.progress * 100)}%` }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <motion.div
            key={child.points_balance}
            initial={{ scale: 1.3, color: "var(--color-sun-600)" }}
            animate={{ scale: 1, color: "var(--color-foreground)" }}
            className={cn("font-display text-2xl font-bold tabular-nums sm:text-3xl")}
          >
            {child.points_balance}
          </motion.div>
          <div className="text-xs font-medium text-muted-foreground">
            {family.currency_emoji} {family.currency_name}
          </div>
        </div>
        <form action={switchChild} className="hidden sm:block">
          <button
            type="submit"
            className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Switch profile"
            title="Switch profile"
          >
            <UsersIcon className="size-5" />
          </button>
        </form>
      </div>
    </header>
  );
}
