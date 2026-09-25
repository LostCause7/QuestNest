"use client";

import { useEffect, useState } from "react";
import { AVATAR_KEYS, AVATARS, COLOR_KEYS, COLORS, colorTheme, avatarEmoji, avatarSrc } from "@/lib/avatars";
import { auraClassName, itemsOf } from "@/lib/cosmetics";
import { AuraFx, FrameOrnament, isDesignAura, ornamentFromClass } from "@/components/shared/look-fx";
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
  const designed = isDesignAura(aura);
  const ornament = ornamentFromClass(frameClassName);
  const src = avatarSrc(avatar);
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [src]);

  const face = (
    <span className={cn("relative z-[1] isolate inline-flex shrink-0 items-center justify-center overflow-visible", sizes, className)} aria-hidden="true">
      <span
        className={cn(
          "absolute inset-0 overflow-hidden rounded-full bg-gradient-to-br shadow-inner ring-2 ring-white/70",
          theme.gradient,
          frameClassName
        )}
      />
      {ornament ? <FrameOrnament kind={ornament} /> : null}
      {src && !broken ? (
        <img
          src={src}
          alt=""
          className="relative z-[1] size-[132%] max-w-none object-contain mix-blend-normal drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)]"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="relative z-[1] drop-shadow-sm">{avatarEmoji(avatar)}</span>
      )}
    </span>
  );

  if (!designed && !auraClass) return face;
  return (
    <span className="relative inline-flex shrink-0 overflow-visible" aria-hidden="true">
      {designed && aura ? <AuraFx aura={aura} /> : null}
      {!designed && auraClass ? (
        <span className={cn("absolute -inset-3 rounded-full bg-gradient-to-br opacity-95 blur-xl qn-aura", auraClass)} />
      ) : null}
      {face}
    </span>
  );
}

export function AvatarPicker({
  value,
  onChange,
  color,
  catalog = false,
}: {
  value: string;
  onChange: (v: string) => void;
  color: string;
  catalog?: boolean;
}) {
  const extras = catalog ? itemsOf("face") : [];
  return (
    <div className={cn("grid grid-cols-6 gap-2 sm:grid-cols-8", catalog && "max-h-72 overflow-y-auto pr-1")}>
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
              "qn-lift flex aspect-square items-center justify-center overflow-visible rounded-2xl border-2 text-2xl",
              selected
                ? cn("border-white/80 bg-gradient-to-br text-white shadow-md", colorTheme(color).gradient)
                : "qn-glass-panel hover:border-primary/40"
            )}
            aria-pressed={selected}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarSrc(key) ?? AVATARS[key].src} alt="" className="size-[118%] max-w-none object-contain drop-shadow-md" />
          </button>
        );
      })}
      {extras.map((item) => {
        const selected = item.key === value;
        const src = avatarSrc(item.key);
        return (
          <button
            key={item.key}
            type="button"
            title={item.label}
            aria-label={item.label}
            onClick={() => onChange(item.key)}
            className={cn(
              "qn-lift flex aspect-square items-center justify-center overflow-visible rounded-2xl border-2 text-2xl",
              selected
                ? cn("border-white/80 bg-gradient-to-br text-white shadow-md", colorTheme(color).gradient)
                : "qn-glass-panel hover:border-primary/40"
            )}
            aria-pressed={selected}
          >
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="" className="size-[118%] max-w-none object-contain drop-shadow-md" />
            ) : (
              <span>{item.emoji}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ColorPicker({ value, onChange, catalog = false }: { value: string; onChange: (v: string) => void; catalog?: boolean }) {
  const extras = catalog ? itemsOf("color") : [];
  return (
    <div className={cn("flex flex-wrap gap-2", catalog && "max-h-40 overflow-y-auto")}>
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
      {extras.map((item) => {
        const selected = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            title={item.label}
            onClick={() => onChange(item.key)}
            className={cn(
              "size-11 overflow-hidden rounded-full bg-gradient-to-br transition-all hover:scale-110",
              item.className,
              selected ? "ring-3 ring-offset-2 ring-offset-background ring-foreground/60" : ""
            )}
            aria-pressed={selected}
            aria-label={item.label}
          />
        );
      })}
    </div>
  );
}
