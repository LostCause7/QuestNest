import { completedSets, lifetimeBadgeKeys } from "@/lib/badges";
import { levelFromXp, xpForLevel } from "@/lib/levels";
import type { Child, ChildBadge, FamilyMilestone } from "@/types/database";

/**
 * Closet cosmetics. Kids unlock them by lifetime points, streaks, levels,
 * badges, sets, seasons, or a parent gift — and can also buy a locked item
 * with Closet Points (CP), earned 1:1 with chore points.
 */

export type CosmeticKind =
  | "face"
  | "color"
  | "frame"
  | "hat"
  | "aura"
  | "nameplate"
  | "banner"
  | "title"
  | "sticker"
  | "room"
  | "soundPack"
  | "confetti";

export type UnlockRule =
  | { by: "free" }
  | { by: "lifetime"; value: number }
  | { by: "streak"; value: number }
  | { by: "level"; value: number }
  | { by: "badge"; value: string }
  | { by: "set"; value: string }
  | { by: "season"; value: number }
  | { by: "gift" };

export type CosmeticItem = {
  key: string;
  kind: CosmeticKind;
  label: string;
  /** Emoji preview for hats, faces, confetti. */
  emoji?: string;
  /** Tailwind classes applied where the item renders. */
  className?: string;
  unlock: UnlockRule;
};

export const STYLE_SLOTS: { kind: CosmeticKind; label: string }[] = [
  { kind: "face", label: "Face" },
  { kind: "color", label: "Color" },
  { kind: "frame", label: "Frame" },
  { kind: "aura", label: "Aura" },
  { kind: "nameplate", label: "Name" },
  { kind: "banner", label: "Banner" },
  { kind: "title", label: "Title" },
  { kind: "room", label: "Room" },
  { kind: "soundPack", label: "Sound" },
  { kind: "confetti", label: "Confetti" },
];

export {
  GATED_FACES,
  GATED_COLORS,
  FRAME_ITEMS,
  HAT_ITEMS,
  AURA_ITEMS,
  NAMEPLATE_ITEMS,
  BANNER_ITEMS,
  TITLE_ITEMS,
  STICKER_ITEMS,
  ROOM_ITEMS,
  SOUND_PACK_ITEMS,
  CONFETTI_ITEMS,
} from "@/lib/looks-catalog";

import {
  GATED_FACES,
  GATED_COLORS,
  FRAME_ITEMS,
  AURA_ITEMS,
  NAMEPLATE_ITEMS,
  BANNER_ITEMS,
  TITLE_ITEMS,
  ROOM_ITEMS,
  SOUND_PACK_ITEMS,
  CONFETTI_ITEMS,
} from "@/lib/looks-catalog";

/* Season pass rewards: unlocked by approved quests inside the current 4-week season, then kept via a claim (gift row). */
const season = (value: number): UnlockRule => ({ by: "season", value });
export const SEASON_ITEMS: CosmeticItem[] = [
  { key: "sparkler", kind: "confetti", label: "Sparkler", emoji: "✨", unlock: season(3) },
  { key: "season", kind: "frame", label: "Season", className: "ring-4 ring-teal-300 shadow-[0_0_0_7px_rgba(94,234,212,0.35)]", unlock: season(6) },
  { key: "seafoam", kind: "aura", label: "Seafoam", className: "from-teal-200 to-cyan-400", unlock: season(10) },
  { key: "ticket", kind: "nameplate", label: "Ticket", className: "rounded-sm border-2 border-dashed border-orange-400 bg-orange-50 px-2 text-orange-800", unlock: season(15) },
  { key: "sunset", kind: "color", label: "Sunset", className: "from-orange-400 via-rose-400 to-purple-500", unlock: season(20) },
  { key: "boardwalk", kind: "banner", label: "Boardwalk", className: "bg-gradient-to-r from-amber-200 via-orange-200 to-rose-200", unlock: season(28) },
  { key: "dragon", kind: "face", label: "Dragon", emoji: "🐲", unlock: season(36) },
  { key: "champion", kind: "frame", label: "Champion", className: "ring-4 ring-yellow-400 shadow-[0_0_22px_rgba(250,204,21,0.9)] qn-frame-shimmer", unlock: season(45) },
];

export const SEASON_NODES = SEASON_ITEMS.map((item) => ({ quests: (item.unlock as { value: number }).value, item }));
export const SEASON_DAYS = 28;

export const CATALOG: CosmeticItem[] = [
  ...GATED_FACES,
  ...GATED_COLORS,
  ...FRAME_ITEMS,
  ...AURA_ITEMS,
  ...NAMEPLATE_ITEMS,
  ...BANNER_ITEMS,
  ...TITLE_ITEMS,
  ...ROOM_ITEMS,
  ...SOUND_PACK_ITEMS,
  ...CONFETTI_ITEMS,
  ...SEASON_ITEMS,
];

export function itemsOf(kind: CosmeticKind) {
  return CATALOG.filter((i) => i.kind === kind);
}

export function findItem(kind: CosmeticKind, key: string | null | undefined) {
  if (!key) return undefined;
  return CATALOG.find((i) => i.kind === kind && i.key === key);
}

export function frameClassName(key?: string | null) {
  return findItem("frame", key)?.className ?? FRAME_ITEMS[0].className;
}

export function auraClassName(key?: string | null) {
  const c = findItem("aura", key)?.className;
  return c ? c : null;
}

export function nameplateClassName(key?: string | null) {
  const c = findItem("nameplate", key)?.className;
  return c ? c : null;
}

export function bannerClassName(key?: string | null) {
  const c = findItem("banner", key)?.className;
  return c ? c : null;
}

export function gatedFaceEmoji(key: string) {
  return CATALOG.find((f) => f.kind === "face" && f.key === key)?.emoji ?? null;
}

export function gatedColorGradient(key: string) {
  return CATALOG.find((c) => c.kind === "color" && c.key === key)?.className ?? null;
}

/** Which 4-week season a family is in, and its date bounds (YYYY-MM-DD). */
export function seasonWindow(familyCreatedAt: string, today: string) {
  const start = new Date(familyCreatedAt.slice(0, 10) + "T00:00:00Z").getTime();
  const now = new Date(today + "T00:00:00Z").getTime();
  const dayMs = 86_400_000;
  const days = Math.max(0, Math.floor((now - start) / dayMs));
  const index = Math.floor(days / SEASON_DAYS);
  const fromMs = start + index * SEASON_DAYS * dayMs;
  const toMs = fromMs + (SEASON_DAYS - 1) * dayMs;
  const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return { index, number: index + 1, from: iso(fromMs), to: iso(toMs), daysLeft: Math.max(0, Math.round((toMs - now) / dayMs)) };
}

/** Everything the unlock rules need to know about a kid. */
export type UnlockContext = {
  lifetime: number;
  streak: number;
  longestStreak: number;
  level: number;
  badges: Set<string>;
  sets: Set<string>;
  gifts: Set<string>;
  /** Parent-made milestones the kid has passed. */
  customUnlocked: boolean;
  /** Approved quests inside the current season. */
  seasonQuests: number;
};

export function unlockContext(
  child: Pick<Child, "lifetime_points" | "current_streak" | "longest_streak">,
  extras: FamilyMilestone[] = [],
  badges: (ChildBadge | string)[] = [],
  gifts: string[] = [],
  seasonQuests = 0
): UnlockContext {
  const badgeKeys = new Set<string>(badges.map((b) => (typeof b === "string" ? b : b.badge_key)));
  for (const k of lifetimeBadgeKeys(child.lifetime_points)) badgeKeys.add(k);
  return {
    lifetime: child.lifetime_points,
    streak: child.current_streak,
    longestStreak: child.longest_streak,
    level: levelFromXp(child.lifetime_points),
    badges: badgeKeys,
    sets: new Set(completedSets([...badgeKeys])),
    gifts: new Set(gifts),
    customUnlocked: extras.some((e) => e.is_active && child.lifetime_points >= e.lifetime_points),
    seasonQuests,
  };
}

export function giftKey(item: Pick<CosmeticItem, "kind" | "key">) {
  return `${item.kind}:${item.key}`;
}

export function isUnlocked(item: CosmeticItem, ctx: UnlockContext) {
  if (ctx.gifts.has(giftKey(item))) return true;
  if (item.kind === "frame" && item.key === "gold" && ctx.customUnlocked) return true;
  const u = item.unlock;
  switch (u.by) {
    case "free":
      return true;
    case "lifetime":
      return ctx.lifetime >= u.value;
    case "streak":
      return ctx.streak >= u.value;
    case "level":
      return ctx.level >= u.value;
    case "badge":
      return ctx.badges.has(u.value);
    case "set":
      return ctx.sets.has(u.value);
    case "season":
      return ctx.seasonQuests >= u.value;
    case "gift":
      return false;
  }
}

export function unlockedItems(kind: CosmeticKind, ctx: UnlockContext) {
  return itemsOf(kind).filter((i) => isUnlocked(i, ctx));
}

export function unlockHint(item: CosmeticItem, currency = "points") {
  const u = item.unlock;
  switch (u.by) {
    case "free":
      return "Free";
    case "lifetime":
      return `${u.value} lifetime ${currency}`;
    case "streak":
      return `${u.value}-day streak`;
    case "level":
      return `Level ${u.value}`;
    case "badge":
      return `Earn the ${u.value.replace(/_/g, " ")} trophy`;
    case "set":
      return `Finish the ${u.value} set`;
    case "season":
      return `${u.value} quests this season`;
    case "gift":
      return "A parent can gift this";
  }
}

/** CP cost to buy a locked look without waiting for its unlock. */
export function closetPrice(item: CosmeticItem) {
  const u = item.unlock;
  switch (u.by) {
    case "free":
      return 0;
    case "lifetime":
      return u.value;
    case "streak":
      return Math.max(25, u.value * 20);
    case "level":
      return Math.max(30, xpForLevel(u.value));
    case "badge":
      return 50;
    case "set":
      return 120;
    case "season":
      return Math.max(30, u.value * 10);
    case "gift":
      return 80;
  }
}

/** Month-based sticker shown when the kid has not equipped one. */
export function seasonalSticker(date = new Date()) {
  return ["❄️", "💝", "☘️", "🌧️", "🌸", "☀️", "🎆", "🍦", "🍎", "🎃", "🍂", "🎄"][date.getMonth()];
}

export const DEFAULT_ROOM = "nest";
export const DEFAULT_SOUND_PACK = "classic";
export const DEFAULT_CONFETTI = "circle";
