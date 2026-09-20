"use client";

import { AVATAR_KEYS, AVATARS, COLOR_KEYS, COLORS, colorTheme, avatarEmoji } from "@/lib/avatars";
import { cn } from "@/lib/utils";

export function KidAvatar({
  avatar,
  color,
  size = "md",
  className,
}: {
  avatar: string;
  color: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const theme = colorTheme(color);
  const sizes = {
    xs: "size-8 text-lg",
    sm: "size-10 text-xl",
    md: "size-14 text-3xl",
    lg: "size-20 text-5xl",
    xl: "size-28 text-7xl",
  }[size];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-inner",
        theme.gradient,
        sizes,
        className
      )}
      aria-hidden="true"
    >
      <span className="drop-shadow-sm">{avatarEmoji(avatar)}</span>
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
            onClick={() => onChange(key)}
            className={cn(
              "flex aspect-square items-center justify-center rounded-2xl border-2 text-2xl transition-all hover:scale-105",
              selected
                ? cn("border-transparent bg-gradient-to-br text-white shadow-md", colorTheme(color).gradient)
                : "border-border bg-card hover:border-primary/40"
            )}
            aria-pressed={selected}
          >
            {AVATARS[key].emoji}
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
              "size-9 rounded-full bg-gradient-to-br transition-all hover:scale-110",
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
