"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { PinPad } from "@/components/shared/pin-pad";
import { play } from "@/lib/sound";
import { colorTheme } from "@/lib/avatars";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/actions/result";

type Props = {
  length?: number;
  /** Called when the PIN reaches `length` digits (or on submit for variable length). */
  onSubmit: (pin: string) => Promise<ActionResult | void>;
  header: React.ReactNode;
  hint?: string;
  variableLength?: boolean;
  /** Kid color key; tints the PIN dots so the screen feels like theirs. */
  color?: string;
};

export function PinScreen({ length = 4, onSubmit, header, hint, variableLength, color }: Props) {
  const dotGradient = color ? colorTheme(color).gradient : null;
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
          play("pinError");
          setError(res.error);
          setShake((s) => s + 1);
          setPin("");
          setFails((n) => {
            const next = n + 1;
            if (next >= 5) setLockedUntil(Date.now() + 30_000);
            return next;
          });
        } else {
          play("pinUnlock");
          setFails(0);
        }
      });
    },
    [onSubmit, lockedUntil]
  );

  const change = useCallback(
    (value: string) => {
      if (pending || Date.now() < lockedUntil) return;
      play("pinDigit");
      const next = value.slice(0, maxLen);
      setPin(next);
      if (next.length === length || (variableLength && next.length >= 4)) submit(next);
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
                i < pin.length
                  ? dotGradient
                    ? cn("scale-110 border-transparent bg-gradient-to-br", dotGradient)
                    : "scale-110 border-primary bg-primary"
                  : "border-foreground/30 bg-transparent",
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
    </div>
  );
}
