"use client";

import { DeleteIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  disabled?: boolean;
  className?: string;
};

/** Big on-screen keypad for kids. */
export function PinPad({ value, onChange, length = 4, disabled, className }: Props) {
  const press = (d: string) => {
    if (disabled) return;
    if (value.length >= length) return;
    onChange(value + d);
  };
  const back = () => onChange(value.slice(0, -1));

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className={cn("mx-auto grid w-full max-w-xs grid-cols-3 gap-3", className)}>
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => press(k)}
          disabled={disabled}
          className="h-16 rounded-2xl bg-card text-2xl font-semibold shadow-sm transition-all hover:bg-accent active:scale-95 disabled:opacity-50"
        >
          {k}
        </button>
      ))}
      <div />
      <button
        type="button"
        onClick={() => press("0")}
        disabled={disabled}
        className="h-16 rounded-2xl bg-card text-2xl font-semibold shadow-sm transition-all hover:bg-accent active:scale-95 disabled:opacity-50"
      >
        0
      </button>
      <button
        type="button"
        onClick={back}
        disabled={disabled || value.length === 0}
        className="flex h-16 items-center justify-center rounded-2xl bg-card text-muted-foreground shadow-sm transition-all hover:bg-accent active:scale-95 disabled:opacity-40"
        aria-label="Delete"
      >
        <DeleteIcon className="size-6" />
      </button>
    </div>
  );
}
