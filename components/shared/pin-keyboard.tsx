"use client";

import { useEffect, useRef, useState } from "react";
import { PIN_KEY_ACTION } from "@/lib/pin-key-path";
import { colorTheme } from "@/lib/avatars";
import { cn } from "@/lib/utils";

function keyFromEvent(event: KeyboardEvent) {
  if (event.key >= "0" && event.key <= "9") return event.key;
  const numpad = /^Numpad([0-9])$/.exec(event.code);
  if (numpad) return numpad[1];
  if (event.key === "Backspace" || event.key === "Delete") return "back";
  return null;
}

export function PinDots({
  draft,
  error,
  color,
  hidden,
  length = 4,
  variableLength,
}: {
  draft: string;
  error?: string | null;
  color?: string;
  hidden: Record<string, string>;
  length?: number;
  variableLength?: boolean;
}) {
  const maxLen = variableLength ? 6 : length;
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);
  const submitted = useRef(false);

  const combined = `${draft}${typed}`.replace(/\D/g, "").slice(0, maxLen);
  const dots = variableLength ? Math.max(4, combined.length) : length;
  const dotGradient = color ? colorTheme(color).gradient : null;
  const role = hidden.role ?? "";

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
      if (event.target === inputRef.current) return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;
      }
      const key = keyFromEvent(event);
      if (!key) return;
      event.preventDefault();
      if (key === "back") {
        let eraseDraft = false;
        setTyped((current) => {
          if (current) return current.slice(0, -1);
          eraseDraft = true;
          return current;
        });
        if (eraseDraft) document.querySelector<HTMLFormElement>('form[data-pin-key="back"]')?.requestSubmit();
        return;
      }
      setTyped((current) => current.concat(key).slice(0, Math.max(0, maxLen - draft.length)));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [draft.length, maxLen]);

  useEffect(() => {
    const ready = role === "parent" ? combined.length >= 4 : combined.length >= length;
    if (!ready || submitted.current || !typed) return;
    submitted.current = true;
    if (pinRef.current) pinRef.current.value = combined;
    formRef.current?.requestSubmit();
  }, [combined, typed, role, length]);

  return (
    <div className="flex flex-col items-center gap-3">
      <form ref={formRef} method="POST" action={PIN_KEY_ACTION} autoComplete="off" className="sr-only" aria-hidden="true">
        {Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <input ref={pinRef} type="hidden" name="pin" value={combined} />
      </form>
      <div className="relative">
        <input
          ref={inputRef}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          enterKeyHint="done"
          value={typed}
          aria-label="PIN"
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "").slice(0, Math.max(0, maxLen - draft.length));
            setTyped(digits);
          }}
          className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
        />
        <div className="flex gap-3" aria-hidden="true">
          {Array.from({ length: dots }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "size-5 rounded-full border-2",
                i < combined.length
                  ? dotGradient
                    ? cn("border-transparent bg-gradient-to-br", dotGradient)
                    : "border-primary bg-primary"
                  : "border-foreground/30 bg-transparent"
              )}
            />
          ))}
        </div>
      </div>
      <p className={cn("h-5 text-sm font-medium", error ? "text-destructive" : "text-muted-foreground")}>{error ?? ""}</p>
    </div>
  );
}
