"use client";

import { useEffect, useState } from "react";
import { AVATAR_KEYS, AVATARS, COLOR_KEYS, COLORS, colorTheme, avatarEmoji, avatarSrc } from "@/lib/avatars";
import { auraClassName } from "@/lib/cosmetics";
import { cn } from "@/lib/utils";

export function KidAvatar({
  avatar,
  color,
  size = "md",
  className,
  frameClassName,
  aura,
}: {
  avatar: string;
  color: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  frameClassName?: string;
  aura?: string | null;
}) {
  const theme = colorTheme(color);
  const sizes = {
    xs: "size-8 text-lg",
    sm: "size-10 text-xl",
    md: "size-14 text-3xl",
    lg: "size-20 text-5xl",
    xl: "size-28 text-7xl",
  }[size];
  const auraClass = auraClassName(aura);
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
      aria-hidden="true"
    >
      {src && !broken ? (
        <img src={src} alt="" className="relative z-[1] size-[92%] object-contain" onError={() => setBroken(true)} />
      ) : (
        <span className="drop-shadow-sm">{avatarEmoji(avatar)}</span>
      )}
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
  return (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
      {AVATAR_KEYS.map((key) => {
        const selected = key === value;
        return (
          <button
            key={key}
            type="button"
            title={AVATARS[key].label}
            aria-label={AVATARS[key].label}
            onClick={() => onChange(key)}
            className={cn(
              "qn-lift flex aspect-square items-center justify-center overflow-hidden rounded-2xl border-2 text-2xl",
              selected
                ? cn("border-white/80 bg-gradient-to-br text-white shadow-md", colorTheme(color).gradient)
                : "qn-glass-panel hover:border-primary/40"
            )}
            aria-pressed={selected}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarSrc(key) ?? AVATARS[key].src} alt="" className="size-[88%] object-contain" />
          </button>
        );
      })}
    </div>
  );
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_KEYS.map((key) => {
        const selected = key === value;
        return (
          <button
            key={key}
            type="button"
            title={COLORS[key].label}
            onClick={() => onChange(key)}
            className={cn(
              "size-11 rounded-full bg-gradient-to-br transition-all hover:scale-110",
              COLORS[key].gradient,
              selected ? "ring-3 ring-offset-2 ring-offset-background ring-foreground/60" : ""
            )}
            aria-pressed={selected}
            aria-label={COLORS[key].label}
          />
        );
      })}
    </div>
  );
}
