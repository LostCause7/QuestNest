export type AvatarKey =
  | "fox"
  | "owl"
  | "dino"
  | "robot"
  | "unicorn"
  | "cat"
  | "dog"
  | "panda"
  | "dragon"
  | "astronaut"
  | "frog"
  | "koala"
  | "lion"
  | "bunny"
  | "penguin"
  | "octopus";

export const AVATARS: Record<AvatarKey, { emoji: string; label: string }> = {
  fox: { emoji: "🦊", label: "Fox" },
  owl: { emoji: "🦉", label: "Owl" },
  dino: { emoji: "🦖", label: "Dino" },
  robot: { emoji: "🤖", label: "Robot" },
  unicorn: { emoji: "🦄", label: "Unicorn" },
  cat: { emoji: "🐱", label: "Cat" },
  dog: { emoji: "🐶", label: "Dog" },
  panda: { emoji: "🐼", label: "Panda" },
  dragon: { emoji: "🐲", label: "Dragon" },
  astronaut: { emoji: "🧑‍🚀", label: "Astronaut" },
  frog: { emoji: "🐸", label: "Frog" },
  koala: { emoji: "🐨", label: "Koala" },
  lion: { emoji: "🦁", label: "Lion" },
  bunny: { emoji: "🐰", label: "Bunny" },
  penguin: { emoji: "🐧", label: "Penguin" },
  octopus: { emoji: "🐙", label: "Octopus" },
};

export const AVATAR_KEYS = Object.keys(AVATARS) as AvatarKey[];

export function avatarEmoji(key: string) {
  return AVATARS[key as AvatarKey]?.emoji ?? "🙂";
}

export type ColorKey =
  | "sky"
  | "grape"
  | "mint"
  | "sunny"
  | "coral"
  | "bubblegum"
  | "lime"
  | "ocean";

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
};

export const COLOR_KEYS = Object.keys(COLORS) as ColorKey[];

export function colorTheme(key: string) {
  return COLORS[key as ColorKey] ?? COLORS.sky;
}
