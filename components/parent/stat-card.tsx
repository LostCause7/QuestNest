import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "default" | "primary" | "sun" | "mint";
  className?: string;
}) {
  const tones = {
    default: "qn-glass-panel",
    primary: "qn-chrome",
    sun: "qn-frost",
    mint: "qn-mirror",
  }[tone];
  const muted = "text-muted-foreground";
  return (
    <div className={cn("qn-lift relative overflow-hidden rounded-2xl p-4", tones, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cn("text-xs font-semibold uppercase tracking-wide", muted)}>{label}</div>
          <div className="mt-1 font-display text-3xl font-semibold tabular-nums">{value}</div>
          {hint ? <div className={cn("mt-1 truncate text-xs font-medium", muted)}>{hint}</div> : null}
        </div>
        {icon ? (
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl text-xl", tone === "default" ? "bg-primary/10" : "bg-white/20")}>
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
