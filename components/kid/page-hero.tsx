import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared colorful header for kid screens. */
export function KidPageHero({
  emoji,
  title,
  subtitle,
  aside,
  className,
}: {
  emoji: string;
  title: string;
  subtitle?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "qn-kid-surface mb-5 flex flex-wrap items-center gap-3 overflow-hidden rounded-3xl p-3 shadow-md ring-1 ring-black/5 sm:gap-4 sm:p-4",
        className
      )}
    >
      <span className="qn-chrome flex size-14 shrink-0 items-center justify-center rounded-2xl text-3xl sm:size-16 sm:text-4xl">
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">{title}</h2>
        {subtitle ? <div className="mt-0.5 text-sm text-muted-foreground">{subtitle}</div> : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  );
}
