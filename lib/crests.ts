export const CREST_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export type CrestColorKey = "chrome" | "frost" | "ember" | "mint" | "ink" | "rose";

export const CREST_COLORS: { key: CrestColorKey; label: string; fill: string }[] = [
  { key: "chrome", label: "Chrome", fill: "from-slate-200 via-slate-400 to-slate-600" },
  { key: "frost", label: "Frost", fill: "from-cyan-200 via-teal-400 to-slate-600" },
  { key: "ember", label: "Ember", fill: "from-amber-200 via-orange-400 to-rose-600" },
  { key: "mint", label: "Mint", fill: "from-emerald-200 via-teal-400 to-emerald-700" },
  { key: "ink", label: "Ink", fill: "from-slate-400 via-indigo-700 to-slate-900" },
  { key: "rose", label: "Rose", fill: "from-rose-200 via-pink-400 to-fuchsia-700" },
];

const OLD_MARK_LETTER: Record<string, string> = {
  nest: "N",
  fox: "F",
  wolf: "W",
  lion: "L",
  bolt: "B",
  star: "S",
  wave: "W",
  flame: "F",
  leaf: "L",
  gem: "G",
  moon: "M",
  comet: "C",
};

export function resolveCrestLetter(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^[A-Za-z]$/.test(trimmed)) return trimmed.toUpperCase();
  if (OLD_MARK_LETTER[trimmed]) return OLD_MARK_LETTER[trimmed];
  const first = trimmed.replace(/[^\p{L}]/gu, "").charAt(0);
  return first ? first.toUpperCase() : null;
}

export function resolveCrestColor(value?: string | null): CrestColorKey {
  if (value && CREST_COLORS.some((c) => c.key === value)) return value as CrestColorKey;
  return "chrome";
}

export function crestSrc(value?: string | null) {
  const letter = resolveCrestLetter(value);
  return letter ? `/crests/${letter.toLowerCase()}.png` : null;
}
