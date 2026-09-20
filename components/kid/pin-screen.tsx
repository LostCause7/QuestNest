"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { PinPad } from "@/components/shared/pin-pad";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/actions/result";

type Props = {
  length?: number;
  /** Called when the PIN reaches `length` digits (or on submit for variable length). */
  onSubmit: (pin: string) => Promise<ActionResult | void>;
  header: React.ReactNode;
  hint?: string;
  variableLength?: boolean;
};

export function PinScreen({ length = 4, onSubmit, header, hint, variableLength }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [pending, startTransition] = useTransition();
  const maxLen = variableLength ? 6 : length;

  const submit = useCallback(
    (value: string) => {
      setError(null);
      startTransition(async () => {
        const res = await onSubmit(value);
        if (res && !res.ok) {
          setError(res.error);
          setShake((s) => s + 1);
          setPin("");
        }
      });
    },
    [onSubmit]
  );

  const change = useCallback(
    (value: string) => {
      if (pending) return;
      const next = value.slice(0, maxLen);
      setPin(next);
      if (!variableLength && next.length === length) submit(next);
    },
    [pending, maxLen, variableLength, length, submit]
  );

  // Physical keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (pending) return;
      if (/^\d$/.test(e.key)) change(pin + e.key);
      else if (e.key === "Backspace") change(pin.slice(0, -1));
      else if (e.key === "Enter" && variableLength && pin.length >= 4) submit(pin);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, pin, variableLength, change, submit]);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8">
      {header}
      <motion.div
        key={shake}
        animate={shake ? { x: [0, -12, 12, -8, 8, 0] } : undefined}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-3"
      >
        <div className="flex gap-3" aria-label="PIN">
          {Array.from({ length: variableLength ? Math.max(4, pin.length) : length }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "size-5 rounded-full border-2 transition-all",
                i < pin.length ? "scale-110 border-primary bg-primary" : "border-foreground/30 bg-transparent",
                pending && "animate-pulse"
              )}
            />
          ))}
        </div>
        <p className={cn("h-5 text-sm font-medium", error ? "text-destructive" : "text-muted-foreground")}>{error ?? hint ?? ""}</p>
      </motion.div>
      <PinPad value={pin} onChange={change} length={maxLen} disabled={pending} />
      {variableLength ? (
        <button
          type="button"
          onClick={() => submit(pin)}
          disabled={pin.length < 4 || pending}
          className="h-12 w-full max-w-xs rounded-2xl bg-primary font-semibold text-primary-foreground shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          Unlock
        </button>
      ) : null}
    </div>
  );
}
