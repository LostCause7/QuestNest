import type { ReactNode } from "react";
import { PinPad } from "@/components/shared/pin-pad";
import { colorTheme } from "@/lib/avatars";
import { cn } from "@/lib/utils";

type Props = {
  header: ReactNode;
  draft: string;
  error?: string | null;
  color?: string;
  hidden: Record<string, string>;
  length?: number;
  variableLength?: boolean;
};

/** Server-rendered PIN pad. Keys are real form posts, not React tap handlers. */
export function PinScreen({ header, draft, error, color, hidden, length = 4, variableLength }: Props) {
  const dotGradient = color ? colorTheme(color).gradient : null;
  const dots = variableLength ? Math.max(4, draft.length) : length;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8">
      {header}
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-3" aria-label="PIN">
          {Array.from({ length: dots }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "size-5 rounded-full border-2",
                i < draft.length
                  ? dotGradient
                    ? cn("border-transparent bg-gradient-to-br", dotGradient)
                    : "border-primary bg-primary"
                  : "border-foreground/30 bg-transparent"
              )}
            />
          ))}
        </div>
        <p className={cn("h-5 text-sm font-medium", error ? "text-destructive" : "text-muted-foreground")}>{error ?? ""}</p>
      </div>
      <PinPad hidden={hidden} />
    </div>
  );
}
