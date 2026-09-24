import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type GlassPanelProps = ComponentProps<"div"> & {
  lift?: boolean;
  chrome?: boolean;
};

export function GlassPanel({
  className,
  lift = false,
  chrome = false,
  ...props
}: GlassPanelProps) {
  return (
    <div
      data-slot="glass-panel"
      className={cn(
        chrome ? "qn-chrome" : "qn-glass-panel",
        "rounded-2xl",
        lift && "qn-lift",
        className
      )}
      {...props}
    />
  );
}
