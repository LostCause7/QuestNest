import { completedSets, lifetimeBadgeKeys } from "@/lib/badges";
import { levelFromXp } from "@/lib/levels";
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
  /** Closet Points to buy this look. Independent of unlock rules. */
  cost?: number;
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
  { key: "season", kind: "frame", label: "Season", className: "ring-4 ring-teal-300 shadow-[0_0_0_7px_rgba(94,234,212,0.35)]", unlock: season(6), cost: 48 },
  { key: "seafoam", kind: "aura", label: "Seafoam", className: "from-teal-200 to-cyan-400", unlock: season(10), cost: 60 },
  { key: "ticket", kind: "nameplate", label: "Ticket", className: "rounded-sm border-2 border-dashed border-orange-400 bg-orange-50 px-2 text-orange-800", unlock: season(15), cost: 72 },
  { key: "sunset", kind: "color", label: "Sunset", className: "from-orange-400 via-rose-400 to-purple-500", unlock: season(20), cost: 88 },
  { key: "boardwalk", kind: "banner", label: "Boardwalk", className: "bg-gradient-to-r from-amber-200 via-orange-200 to-rose-200", unlock: season(28), cost: 110 },
  { key: "dragon", kind: "face", label: "Dragon", emoji: "🐲", unlock: season(36), cost: 140 },
  { key: "champion", kind: "frame", label: "Champion", className: "ring-4 ring-yellow-400 shadow-[0_0_22px_rgba(250,204,21,0.9)] qn-frame-shimmer", unlock: season(45), cost: 180 },
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
  const seen = new Set<string>();
  return CATALOG.filter((i) => {
    if (i.kind !== kind || seen.has(i.key)) return false;
    seen.add(i.key);
    return true;
  });
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

function meetsUnlock(u: UnlockRule, ctx: UnlockContext) {
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

export function isUnlocked(item: CosmeticItem, ctx: UnlockContext) {
  if (ctx.gifts.has(giftKey(item))) return true;
  if (item.kind === "frame" && item.key === "gold" && ctx.customUnlocked) return true;
  return CATALOG.some((other) => other.kind === item.kind && other.key === item.key && meetsUnlock(other.unlock, ctx));
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

/** CP cost to buy a locked look. Priced on its own — not lifetime points. */
export function closetPrice(item: CosmeticItem) {
  if (item.unlock.by === "free") return 0;
  if (typeof item.cost === "number" && item.cost > 0) return item.cost;
  const u = item.unlock;
  switch (u.by) {
    case "lifetime":
    case "level":
      return 80;
    case "streak":
      return 20 + u.value * 4;
    case "badge":
      return 45;
    case "set":
      return 90;
    case "season":
      return 24 + u.value * 3;
    case "gift":
      return 70;
  }
}

/** Image for a Closet tile. Faces use portraits; everything else uses a generated thumb. */
export function cosmeticThumb(item: Pick<CosmeticItem, "kind" | "key">) {
  if (item.kind === "face") return `/faces/${item.key}.png`;
  return `/closet/${item.kind}/${item.key}.svg`;
}

/** Month-based sticker shown when the kid has not equipped one. */
export function seasonalSticker(date = new Date()) {
  return ["❄️", "💝", "☘️", "🌧️", "🌸", "☀️", "🎆", "🍦", "🍎", "🎃", "🍂", "🎄"][date.getMonth()];
}

export const DEFAULT_ROOM = "nest";
export const DEFAULT_SOUND_PACK = "classic";
export const DEFAULT_CONFETTI = "circle";
