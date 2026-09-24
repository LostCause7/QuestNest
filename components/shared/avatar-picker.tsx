"use client";

import { useEffect, useId, useState } from "react";
import { AVATAR_KEYS, AVATARS, COLOR_KEYS, COLORS, colorTheme, avatarEmoji, avatarSrc } from "@/lib/avatars";
import { auraClassName, hatEmoji } from "@/lib/cosmetics";
import { cn } from "@/lib/utils";

export function KidAvatar({
  avatar,
  color,
  size = "md",
  className,
  frameClassName,
  sticker,
  hat,
  aura,
}: {
  avatar: string;
  color: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  frameClassName?: string;
  sticker?: string | null;
  hat?: string | null;
  aura?: string | null;
}) {
  const theme = colorTheme(color);
  const px = { xs: 32, sm: 40, md: 56, lg: 80, xl: 112 }[size];
  const sizes = {
    xs: "size-8 text-lg",
    sm: "size-10 text-xl",
    md: "size-14 text-3xl",
    lg: "size-20 text-5xl",
    xl: "size-28 text-7xl",
  }[size];
  const hatSize = { xs: "text-xs -top-2", sm: "text-sm -top-2.5", md: "text-xl -top-3", lg: "text-3xl -top-4", xl: "text-4xl -top-5" }[size];
  const auraClass = auraClassName(aura);
  const hatChar = hatEmoji(hat);
  const src = avatarSrc(avatar);
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [src]);

  const face = (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br text-white shadow-inner ring-2 ring-white/70",
        theme.gradient,
        sizes,
        frameClassName,
        className
      )}
      style={{ width: px, height: px }}
      aria-hidden="true"
    >
      {src && !broken ? (
        <img src={src} alt="" width={px} height={px} className="size-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <span className="drop-shadow-sm">{avatarEmoji(avatar)}</span>
      )}
      {sticker ? <span className="absolute -top-1 -right-1 text-base drop-shadow-sm sm:text-lg">{sticker}</span> : null}
      {hatChar ? (
        <span className={cn("pointer-events-none absolute left-1/2 -translate-x-1/2 drop-shadow-md", hatSize)}>{hatChar}</span>
      ) : null}
    </span>
  );

  if (!auraClass) return face;
  return (
    <span className="relative inline-flex shrink-0" aria-hidden="true">
      <span className={cn("absolute -inset-3 rounded-full bg-gradient-to-br opacity-95 blur-xl qn-aura", auraClass)} />
      {face}
    </span>
  );
}

export function AvatarPicker({
  value,
  onChange,
  color,
}: {
  value: string;
  onChange: (v: string) => void;
  color: string;
}) {
  const group = useId();
  return (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
      {AVATAR_KEYS.map((key) => {
        const selected = key === value;
        return (
          <label
            key={key}
            title={AVATARS[key].label}
            className={cn(
              "qn-lift flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 text-2xl",
              selected
                ? cn("border-white/80 bg-gradient-to-br text-white shadow-md", colorTheme(color).gradient)
                : "qn-glass-panel hover:border-primary/40"
            )}
          >
            <input type="radio" name={group} className="sr-only" checked={selected} onChange={() => onChange(key)} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={AVATARS[key].src} alt={AVATARS[key].label} className="size-full object-cover" />
          </label>
        );
      })}
    </div>
  );
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const group = useId();
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_KEYS.map((key) => {
        const selected = key === value;
        return (
          <label
            key={key}
            title={COLORS[key].label}
            className={cn(
              "size-11 cursor-pointer rounded-full bg-gradient-to-br transition-all hover:scale-110",
              COLORS[key].gradient,
              selected ? "ring-3 ring-offset-2 ring-offset-background ring-foreground/60" : ""
            )}
          >
            <input type="radio" name={group} className="sr-only" checked={selected} onChange={() => onChange(key)} aria-label={COLORS[key].label} />
          </label>
        );
      })}
    </div>
  );
}
