"use client";

import { useRef, type TouchEvent } from "react";
import { DeleteIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  disabled?: boolean;
  className?: string;
};

const KEY_CLASS =
  "h-16 touch-manipulation rounded-2xl bg-card text-2xl font-semibold shadow-sm select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] disabled:opacity-50";

/** Big on-screen keypad for kids. */
export function PinPad({ value, onChange, length = 4, disabled, className }: Props) {
  const valueRef = useRef(value);
  valueRef.current = value;
  const last = useRef(0);

  const fire = (fn: () => void) => {
    if (disabled) return;
    const now = performance.now();
    if (now - last.current < 80) return;
    last.current = now;
    fn();
  };

  const press = (d: string) => {
    const current = valueRef.current;
    if (current.length >= length) return;
    onChange(current + d);
  };

  const back = () => {
    const current = valueRef.current;
    if (!current) return;
    onChange(current.slice(0, -1));
  };

  const bind = (fn: () => void) => ({
    onTouchEnd: (e: TouchEvent<HTMLButtonElement>) => {
      e.preventDefault();
      fire(fn);
    },
    onClick: () => fire(fn),
  });

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className={cn("qn-pinpad mx-auto grid w-full max-w-xs grid-cols-3 gap-3", className)}>
      {keys.map((k) => (
        <button key={k} type="button" disabled={disabled} className={KEY_CLASS} {...bind(() => press(k))}>
          {k}
        </button>
      ))}
      <div />
      <button type="button" disabled={disabled} className={KEY_CLASS} {...bind(() => press("0"))}>
        0
      </button>
      <button
        type="button"
        disabled={disabled || value.length === 0}
        className={cn(KEY_CLASS, "flex items-center justify-center text-muted-foreground disabled:opacity-40")}
        aria-label="Delete"
        {...bind(back)}
      >
        <DeleteIcon className="size-6" />
      </button>
    </div>
  );
}
