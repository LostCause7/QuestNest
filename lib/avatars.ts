import { gatedColorGradient, gatedFaceEmoji } from "@/lib/cosmetics";

export type AvatarKey = "luna" | "ivy" | "zoe" | "max" | "nico" | "ash" | "phoenix" | "wolf" | "cat" | "dog";

export const DEFAULT_AVATAR: AvatarKey = "luna";

export const AVATARS: Record<AvatarKey, { emoji: string; label: string; src: string }> = {
  luna: { emoji: "👧", label: "Luna", src: "/faces/luna.png" },
  ivy: { emoji: "👧", label: "Ivy", src: "/faces/ivy.png" },
  zoe: { emoji: "👧", label: "Zoe", src: "/faces/zoe.png" },
  max: { emoji: "👦", label: "Max", src: "/faces/max.png" },
  nico: { emoji: "👦", label: "Nico", src: "/faces/nico.png" },
  ash: { emoji: "👦", label: "Ash", src: "/faces/ash.png" },
  phoenix: { emoji: "🦅", label: "Phoenix", src: "/faces/phoenix.png" },
  wolf: { emoji: "🐺", label: "Wolf", src: "/faces/wolf.png" },
  cat: { emoji: "🐱", label: "Cat", src: "/faces/cat.png" },
  dog: { emoji: "🐶", label: "Dog", src: "/faces/dog.png" },
};

export const AVATAR_KEYS = Object.keys(AVATARS) as AvatarKey[];

export function avatarEmoji(key: string) {
  return AVATARS[key as AvatarKey]?.emoji ?? gatedFaceEmoji(key) ?? "🙂";
}

const FACE_CACHE = "5";

export function avatarSrc(key: string) {
  if (AVATARS[key as AvatarKey] || gatedFaceEmoji(key)) return `/faces/${key}.png?v=${FACE_CACHE}`;
  return null;
}

export type ColorKey =
  | "sky"
  | "grape"
  | "mint"
  | "sunny"
  | "coral"
  | "bubblegum"
  | "lime"
  | "ocean"
  | "slate"
  | "rose"
  | "honey"
  | "midnight";

export const COLORS: Record<
  ColorKey,
  { label: string; bg: string; ring: string; text: string; soft: string; gradient: string }
> = {
  sky: {
    label: "Sky",
    bg: "bg-sky-400",
    ring: "ring-sky-400",
    text: "text-sky-600",
    soft: "bg-sky-100",
    gradient: "from-sky-400 to-blue-500",
  },
  grape: {
    label: "Grape",
    bg: "bg-violet-500",
    ring: "ring-violet-500",
    text: "text-violet-600",
    soft: "bg-violet-100",
    gradient: "from-violet-500 to-purple-600",
  },
  mint: {
    label: "Mint",
    bg: "bg-emerald-400",
    ring: "ring-emerald-400",
    text: "text-emerald-600",
    soft: "bg-emerald-100",
    gradient: "from-emerald-400 to-teal-500",
  },
  sunny: {
    label: "Sunny",
    bg: "bg-amber-400",
    ring: "ring-amber-400",
    text: "text-amber-600",
    soft: "bg-amber-100",
    gradient: "from-amber-300 to-orange-400",
  },
  coral: {
    label: "Coral",
    bg: "bg-orange-500",
    ring: "ring-orange-500",
    text: "text-orange-600",
    soft: "bg-orange-100",
    gradient: "from-orange-400 to-rose-500",
  },
  bubblegum: {
    label: "Bubblegum",
    bg: "bg-pink-400",
    ring: "ring-pink-400",
    text: "text-pink-600",
    soft: "bg-pink-100",
    gradient: "from-pink-400 to-fuchsia-500",
  },
  lime: {
    label: "Lime",
    bg: "bg-lime-400",
    ring: "ring-lime-400",
    text: "text-lime-700",
    soft: "bg-lime-100",
    gradient: "from-lime-400 to-green-500",
  },
  ocean: {
    label: "Ocean",
    bg: "bg-cyan-500",
    ring: "ring-cyan-500",
    text: "text-cyan-700",
    soft: "bg-cyan-100",
    gradient: "from-cyan-400 to-indigo-500",
  },
  slate: {
    label: "Slate",
    bg: "bg-slate-500",
    ring: "ring-slate-500",
    text: "text-slate-700",
    soft: "bg-slate-100",
    gradient: "from-slate-400 to-slate-700",
  },
  rose: {
    label: "Rose",
    bg: "bg-rose-500",
    ring: "ring-rose-500",
    text: "text-rose-600",
    soft: "bg-rose-100",
    gradient: "from-rose-400 to-red-500",
  },
  honey: {
    label: "Honey",
    bg: "bg-yellow-500",
    ring: "ring-yellow-500",
    text: "text-yellow-700",
    soft: "bg-yellow-100",
    gradient: "from-yellow-300 to-amber-500",
  },
  midnight: {
    label: "Midnight",
    bg: "bg-indigo-700",
    ring: "ring-indigo-700",
    text: "text-indigo-700",
    soft: "bg-indigo-100",
    gradient: "from-indigo-600 to-violet-900",
  },
};

export const COLOR_KEYS = Object.keys(COLORS) as ColorKey[];

export function colorTheme(key: string) {
  const base = COLORS[key as ColorKey];
  if (base) return base;
  const gated = gatedColorGradient(key);
  if (gated) return { ...COLORS.slate, label: key, gradient: gated };
  return COLORS.sky;
}
