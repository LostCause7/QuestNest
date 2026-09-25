import { FRAME_ITEMS, frameClassName } from "@/lib/cosmetics";
import type { EquippedStyle, FamilyMilestone } from "@/types/database";

export type { EquippedStyle, FamilyMilestone };

export type MilestoneUnlock = {
  key: string;
  points: number;
  name: string;
  description: string;
  icon: string;
  title: string;
  frame: string;
  sticker: string;
};

/** Lifetime points only — banked/spendable balance does not matter. */
export const LIFETIME_MILESTONES: MilestoneUnlock[] = [
  { key: "life_25", points: 25, name: "First Spark", description: "Earned 25 lifetime points.", icon: "✨", title: "Spark", frame: "none", sticker: "✨" },
  { key: "life_50", points: 50, name: "Warm Glow", description: "Earned 50 lifetime points.", icon: "🌟", title: "Glowbug", frame: "sun", sticker: "🌟" },
  { key: "life_75", points: 75, name: "Nest Helper", description: "Earned 75 lifetime points.", icon: "🪺", title: "Helper", frame: "none", sticker: "🪺" },
  { key: "life_100", points: 100, name: "Century Club", description: "Earned 100 lifetime points.", icon: "💯", title: "Centurion", frame: "gold", sticker: "💯" },
  { key: "life_150", points: 150, name: "Trail Scout", description: "Earned 150 lifetime points.", icon: "🧭", title: "Scout", frame: "mint", sticker: "🧭" },
  { key: "life_200", points: 200, name: "Star Collector", description: "Earned 200 lifetime points.", icon: "⭐", title: "Collector", frame: "sun", sticker: "⭐" },
  { key: "life_250", points: 250, name: "Brave Heart", description: "Earned 250 lifetime points.", icon: "❤️", title: "Braveheart", frame: "coral", sticker: "❤️" },
  { key: "life_350", points: 350, name: "Quest Knight", description: "Earned 350 lifetime points.", icon: "🛡️", title: "Knight", frame: "gold", sticker: "🛡️" },
  { key: "life_500", points: 500, name: "High Roller", description: "Earned 500 lifetime points.", icon: "💎", title: "High Roller", frame: "sparkle", sticker: "💎" },
  { key: "life_750", points: 750, name: "Sky Writer", description: "Earned 750 lifetime points.", icon: "🌈", title: "Skywriter", frame: "rainbow", sticker: "🌈" },
  { key: "life_1000", points: 1000, name: "Treasure Hoard", description: "Earned 1,000 lifetime points.", icon: "🏆", title: "Legend", frame: "crown", sticker: "🏆" },
  { key: "life_1500", points: 1500, name: "Myth Maker", description: "Earned 1,500 lifetime points.", icon: "🐉", title: "Myth Maker", frame: "rainbow", sticker: "🐉" },
  { key: "life_2000", points: 2000, name: "Nest Champion", description: "Earned 2,000 lifetime points.", icon: "🥇", title: "Champion", frame: "crown", sticker: "🥇" },
  { key: "life_3000", points: 3000, name: "Galaxy Kid", description: "Earned 3,000 lifetime points.", icon: "🪐", title: "Galactic", frame: "sparkle", sticker: "🪐" },
  { key: "life_5000", points: 5000, name: "Forever Nest", description: "Earned 5,000 lifetime points.", icon: "👑", title: "Sovereign", frame: "crown", sticker: "👑" },
];

export type StyleUnlock = { key: string; label: string; kind: "title" | "frame" | "sticker" };

/** Frames now live in lib/cosmetics.ts; kept here so older callers keep working. */
export const FRAMES: { key: string; label: string; className: string }[] = FRAME_ITEMS.map((f) => ({
  key: f.key,
  label: f.label,
  className: f.className ?? "",
}));

export function frameClass(key?: string | null) {
  return frameClassName(key);
}

export function unlockedMilestones(lifetimePoints: number, extras: FamilyMilestone[] = []) {
  const builtIn = LIFETIME_MILESTONES.filter((m) => lifetimePoints >= m.points);
  const custom = extras
    .filter((m) => m.is_active && lifetimePoints >= m.lifetime_points)
    .map((m) => ({
      key: `custom_${m.id}`,
      points: m.lifetime_points,
      name: m.title,
      description: `Earned ${m.lifetime_points} lifetime points.`,
      icon: m.icon,
      title: m.title,
      frame: "gold",
      sticker: m.icon,
    }));
  return [...builtIn, ...custom].sort((a, b) => a.points - b.points);
}

export function nextMilestone(lifetimePoints: number, extras: FamilyMilestone[] = []) {
  const upcoming = [
    ...LIFETIME_MILESTONES.filter((m) => lifetimePoints < m.points),
    ...extras
      .filter((m) => m.is_active && lifetimePoints < m.lifetime_points)
      .map((m) => ({ points: m.lifetime_points, name: m.title, icon: m.icon })),
  ].sort((a, b) => a.points - b.points);
  return upcoming[0] ?? null;
}

export function unlockedTitles(lifetimePoints: number, extras: FamilyMilestone[] = []) {
  const set = new Map<string, string>();
  set.set("Rookie", "Rookie");
  for (const m of unlockedMilestones(lifetimePoints, extras)) set.set(m.title, m.title);
  return [...set.values()];
}

export function unlockedFrames(lifetimePoints: number, extras: FamilyMilestone[] = []) {
  const set = new Set<string>(["none"]);
  for (const m of unlockedMilestones(lifetimePoints, extras)) set.add(m.frame);
  return FRAMES.filter((f) => set.has(f.key));
}

export function unlockedStickers(lifetimePoints: number, extras: FamilyMilestone[] = []) {
  const set = new Set<string>();
  for (const m of unlockedMilestones(lifetimePoints, extras)) set.add(m.sticker);
  return [...set];
}

export function styleStorageKey(childId: string) {
  return `qn_style_${childId}`;
}

/** Normalized look for rendering. Hats and stickers are no longer shown. */
export function childLook(style?: EquippedStyle | null, _opts: { seasonal?: boolean } = {}): EquippedStyle {
  return {
    title: style?.title ?? null,
    frame: style?.frame ?? "none",
    sticker: null,
    hat: null,
    aura: style?.aura ?? null,
    nameplate: style?.nameplate ?? null,
    banner: style?.banner ?? null,
    room: style?.room ?? null,
    soundPack: style?.soundPack ?? null,
    confetti: style?.confetti ?? null,
    showcase: style?.showcase ?? null,
    savingFor: style?.savingFor ?? null,
  };
}
