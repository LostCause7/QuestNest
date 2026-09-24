"use client";

import { useEffect, useRef } from "react";
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
  "h-16 rounded-2xl bg-card text-2xl font-semibold shadow-sm select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] disabled:opacity-40";

/**
 * iPad / WebKit: React `onTouchEnd` + preventDefault is attached as a passive
 * delegated listener, so the tap highlights but the digit never lands. Bind a
 * real click/pointerup on the keypad node instead — no preventDefault.
 */
export function PinPad({ value, onChange, length = 4, disabled, className }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const lastRef = useRef(0);
  valueRef.current = value;
  onChangeRef.current = onChange;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const run = (key: string) => {
      if (disabled || !key) return;
      const now = performance.now();
      if (now - lastRef.current < 80) return;
      lastRef.current = now;
      const current = valueRef.current;
      if (key === "back") {
        if (!current) return;
        onChangeRef.current(current.slice(0, -1));
        return;
      }
      if (current.length >= length) return;
      onChangeRef.current(current + key);
    };

    const onTap = (event: Event) => {
      const el = (event.target as Element | null)?.closest?.("[data-pin-key]");
      if (!(el instanceof HTMLElement) || !root.contains(el)) return;
      run(el.dataset.pinKey ?? "");
    };

    root.addEventListener("click", onTap);
    root.addEventListener("pointerup", onTap);
    return () => {
      root.removeEventListener("click", onTap);
      root.removeEventListener("pointerup", onTap);
    };
  }, [disabled, length]);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div
      ref={rootRef}
      className={cn("qn-pinpad mx-auto grid w-full max-w-xs grid-cols-3 gap-3", className)}
      style={{ touchAction: "manipulation" }}
    >
      {keys.map((k) => (
        <button key={k} type="button" data-pin-key={k} disabled={disabled} className={KEY_CLASS}>
          {k}
        </button>
      ))}
      <div />
      <button type="button" data-pin-key="0" disabled={disabled} className={KEY_CLASS}>
        0
      </button>
      <button
        type="button"
        data-pin-key="back"
        disabled={disabled || value.length === 0}
        className={cn(KEY_CLASS, "flex items-center justify-center text-muted-foreground")}
        aria-label="Delete"
      >
        <DeleteIcon className="size-6 pointer-events-none" />
      </button>
    </div>
  );
}
