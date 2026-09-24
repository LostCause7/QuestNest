"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { PinPad } from "@/components/shared/pin-pad";
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

function applyKey(current: string, key: string, maxLen: number) {
  if (key === "back") return current.slice(0, -1);
  if (/^\d$/.test(key)) return `${current}${key}`.slice(0, maxLen);
  return current;
}

function isReady(role: string, digits: string, length: number) {
  return role === "parent" ? digits.length >= 4 : digits.length >= length;
}

export function PinEntry({
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
  const [digits, setDigits] = useState(draft);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);
  const allowPost = useRef(false);

  const shown = digits.replace(/\D/g, "").slice(0, maxLen);
  const shownRef = useRef(shown);
  shownRef.current = shown;
  const dots = variableLength ? Math.max(4, shown.length) : length;
  const dotGradient = color ? colorTheme(color).gradient : null;
  const role = hidden.role ?? "";

  useEffect(() => {
    setDigits(draft);
    allowPost.current = false;
  }, [draft]);

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
  }, []);

  function unlock(next: string) {
    if (!isReady(role, next, length) || allowPost.current) return;
    allowPost.current = true;
    if (pinRef.current) pinRef.current.value = next;
    formRef.current?.requestSubmit();
  }

  function typeKey(key: string) {
    const next = applyKey(shownRef.current, key, maxLen);
    setDigits(next);
    if (key !== "back") unlock(next);
  }

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
      typeKey(key);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [maxLen, role, length]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (allowPost.current) return;
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const key = submitter instanceof HTMLButtonElement ? submitter.value : "";
    typeKey(key);
  }

  return (
    <form
      ref={formRef}
      method="POST"
      action={PIN_KEY_ACTION}
      autoComplete="off"
      onSubmit={onSubmit}
      className="flex w-full flex-col items-center gap-8"
    >
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input ref={pinRef} type="hidden" name="pin" value={shown} />
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <input
            ref={inputRef}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            enterKeyHint="done"
            value={shown}
            aria-label="PIN"
            onChange={(event) => {
              const next = event.target.value.replace(/\D/g, "").slice(0, maxLen);
              setDigits(next);
              unlock(next);
            }}
            className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
          />
          <div className="flex gap-3" aria-hidden="true">
            {Array.from({ length: dots }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "size-5 rounded-full border-2",
                  i < shown.length
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
      <PinPad />
    </form>
  );
}
