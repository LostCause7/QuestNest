"use client";

import { wallpaperSrc } from "@/lib/cosmetics";

export const WALLPAPER_EVENT = "qn-wallpaper";

const preloaded = new Map<string, HTMLImageElement>();

/** Decode the wallpaper once per browser session so kid-page navigations stay instant. */
export function preloadWallpaper(key: string | null | undefined) {
  const src = wallpaperSrc(key);
  if (!src || typeof window === "undefined") return src;
  if (!preloaded.has(src)) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    preloaded.set(src, img);
  }
  return src;
}

export function setWallpaper(key: string | null | undefined) {
  if (typeof window === "undefined") return;
  const src = preloadWallpaper(key);
  window.dispatchEvent(new CustomEvent(WALLPAPER_EVENT, { detail: src }));
}
