"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { PinPad } from "@/components/shared/pin-pad";
import { playTap, playUnlock } from "@/lib/sound";
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
  const [fails, setFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const locked = lockedUntil > now;
  const maxLen = variableLength ? 6 : length;

  useEffect(() => {
    if (lockedUntil <= Date.now()) return;
    const t = window.setInterval(() => setNow(Date.now()), 400);
    return () => window.clearInterval(t);
  }, [lockedUntil]);

  const submit = useCallback(
    (value: string) => {
      if (Date.now() < lockedUntil) {
        setError("Too many tries. Wait a moment.");
        return;
      }
      setError(null);
      startTransition(async () => {
        const res = await onSubmit(value);
        if (res && !res.ok) {
          setError(res.error);
          setShake((s) => s + 1);
          setPin("");
          setFails((n) => {
            const next = n + 1;
            if (next >= 5) setLockedUntil(Date.now() + 30_000);
            return next;
          });
        } else {
          playUnlock();
          setFails(0);
        }
      });
    },
    [onSubmit, lockedUntil]
  );

  const change = useCallback(
    (value: string) => {
      if (pending || Date.now() < lockedUntil) return;
      playTap();
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
        <p className={cn("h-5 text-sm font-medium", error || locked ? "text-destructive" : "text-muted-foreground")}>
          {locked ? `Too many tries. Wait ${Math.ceil((lockedUntil - now) / 1000)}s.` : (error ?? hint ?? "")}
        </p>
      </motion.div>
      <PinPad value={pin} onChange={change} length={maxLen} disabled={pending || locked} />
      {variableLength ? (
        <button
          type="button"
          onClick={() => submit(pin)}
          disabled={pin.length < 4 || pending || locked}
          className="h-12 w-full max-w-xs rounded-2xl bg-primary font-semibold text-primary-foreground shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          Unlock
        </button>
      ) : null}
    </div>
  );
}
