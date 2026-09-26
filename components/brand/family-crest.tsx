"use client";

import { useEffect, useState } from "react";
import { CREST_COLORS, crestSrc, resolveCrestColor, resolveCrestLetter } from "@/lib/crests";
import { cn } from "@/lib/utils";

export function FamilyCrest({
  mark,
  color,
  className,
  size = "md",
}: {
  mark?: string | null;
  color?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const letter = resolveCrestLetter(mark) ?? "A";
  const src = crestSrc(letter);
  const tone = resolveCrestColor(color);
  const fill = CREST_COLORS.find((c) => c.key === tone)?.fill ?? CREST_COLORS[0].fill;
  const dim = { sm: "size-8 text-sm", md: "size-12 text-xl", lg: "size-16 text-3xl", xl: "size-24 text-5xl" }[size];
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br p-[2px] shadow-md ring-2 ring-white/55",
        fill,
        dim,
        className
      )}
      aria-hidden="true"
    >
      <span className="relative size-full overflow-hidden rounded-full bg-slate-950">
        {src && !broken ? (
          <img src={src} alt="" className="size-full object-cover" onError={() => setBroken(true)} />
        ) : (
          <span className="flex size-full items-center justify-center font-display font-extrabold tracking-tight text-white">
            {letter}
          </span>
        )}
      </span>
    </span>
  );
}
