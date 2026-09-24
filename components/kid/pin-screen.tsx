"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PinPad } from "@/components/shared/pin-pad";
import { play } from "@/lib/sound";
import { colorTheme } from "@/lib/avatars";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/actions/result";

type Props = {
  length?: number;
  onSubmit: (pin: string) => Promise<ActionResult | void>;
  header: React.ReactNode;
  hint?: string;
  variableLength?: boolean;
  color?: string;
};

function beep(event: "pinDigit" | "pinUnlock" | "pinError") {
  try {
    play(event);
  } catch {
    /* Web Audio can throw on iPad before a user-gesture unlock. */
  }
}

export function PinScreen({ length = 4, onSubmit, header, hint, variableLength, color }: Props) {
  const dotGradient = color ? colorTheme(color).gradient : null;
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [busy, setBusy] = useState(false);
  const [fails, setFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const locked = lockedUntil > now;
  const maxLen = variableLength ? 6 : length;
  const pinRef = useRef("");
  const idleTimer = useRef<number | null>(null);
  const submitting = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lockedUntil <= Date.now()) return;
    const t = window.setInterval(() => setNow(Date.now()), 400);
    return () => window.clearInterval(t);
  }, [lockedUntil]);

  const clearIdle = useCallback(() => {
    if (idleTimer.current != null) {
      window.clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  }, []);

  useEffect(() => () => clearIdle(), [clearIdle]);

  const submit = useCallback(
    (value: string) => {
      clearIdle();
      if (submitting.current || Date.now() < lockedUntil) return;
      submitting.current = true;
      setBusy(true);
      setError(null);
      void Promise.resolve(onSubmit(value))
        .then((res) => {
          if (res && !res.ok) {
            submitting.current = false;
            setBusy(false);
            beep("pinError");
            setError(res.error);
            setShake((s) => s + 1);
            pinRef.current = "";
            setPin("");
            setFails((n) => {
              const next = n + 1;
              if (next >= 5) setLockedUntil(Date.now() + 30_000);
              return next;
            });
            return;
          }
          beep("pinUnlock");
          setFails(0);
        })
        .catch((err: unknown) => {
          // Server-action redirect throws; let Next navigate. Retry if it wasn't a redirect.
          const digest = typeof err === "object" && err && "digest" in err ? String((err as { digest?: string }).digest) : "";
          if (digest.includes("NEXT_REDIRECT")) return;
          submitting.current = false;
          setBusy(false);
          throw err;
        });
    },
    [onSubmit, lockedUntil, clearIdle]
  );

  const apply = useCallback(
    (raw: string) => {
      if (submitting.current || Date.now() < lockedUntil) return;
      const next = raw.replace(/\D/g, "").slice(0, maxLen);
      if (next === pinRef.current) return;
      pinRef.current = next;
      setPin(next);
      clearIdle();
      if (next.length > 0) beep("pinDigit");
      if (next.length === maxLen || (!variableLength && next.length === length)) {
        submit(next);
        return;
      }
      if (variableLength && next.length >= 4) {
        idleTimer.current = window.setTimeout(() => submit(next), 400);
      }
    },
    [maxLen, variableLength, length, submit, lockedUntil, clearIdle]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (submitting.current) return;
      if (/^\d$/.test(e.key)) apply(pinRef.current + e.key);
      else if (e.key === "Backspace") apply(pinRef.current.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [apply]);

  const dots = variableLength ? Math.max(4, pin.length) : length;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8" style={{ touchAction: "manipulation" }}>
      {header}
      <div className={cn("relative flex flex-col items-center gap-3", shake ? "animate-wiggle" : "")}>
        <div className="relative">
          <div className="flex gap-3" aria-hidden="true">
            {Array.from({ length: dots }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "size-5 rounded-full border-2 transition-all",
                  i < pin.length
                    ? dotGradient
                      ? cn("scale-110 border-transparent bg-gradient-to-br", dotGradient)
                      : "scale-110 border-primary bg-primary"
                    : "border-foreground/30 bg-transparent",
                  busy && "animate-pulse"
                )}
              />
            ))}
          </div>
          <input
            ref={inputRef}
            id="qn-pin-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            pattern="[0-9]*"
            maxLength={maxLen}
            value={pin}
            disabled={busy || locked}
            aria-label="PIN"
            onChange={(e) => apply(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-text opacity-0"
          />
        </div>
        <p className={cn("h-5 text-sm font-medium", error || locked ? "text-destructive" : "text-muted-foreground")}>
          {locked ? `Too many tries. Wait ${Math.ceil((lockedUntil - now) / 1000)}s.` : (error ?? hint ?? "")}
        </p>
      </div>
      <PinPad value={pin} onChange={apply} length={maxLen} disabled={busy || locked} />
    </div>
  );
}
