"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
  masked?: boolean;
  className?: string;
  id?: string;
};

/** Four (or N) digit PIN boxes backed by a single hidden input. */
export function PinInput({ value, onChange, length = 4, autoFocus, masked = true, className, id }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <div className={cn("relative", className)}>
      <input
        ref={ref}
        id={id}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        maxLength={length}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, length))}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        aria-label="PIN"
      />
      <div className="flex justify-center gap-3" aria-hidden="true">
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          const active = i === value.length;
          return (
            <div
              key={i}
              className={cn(
                "flex h-14 w-12 items-center justify-center rounded-xl border-2 bg-card text-2xl font-semibold transition-all",
                active ? "border-primary shadow-[0_0_0_4px_var(--color-primary)]/20" : "border-border",
                filled ? "border-primary/60" : ""
              )}
            >
              {filled ? (masked ? "•" : value[i]) : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
