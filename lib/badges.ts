export type BadgeDef = {
  key: string;
  name: string;
  description: string;
  emoji: string;
  tier: "bronze" | "silver" | "gold";
};

/** Keys must match private.check_badges() in the SQL migration. */
export const BADGES: BadgeDef[] = [
  { key: "first_quest", name: "First Quest", description: "Completed your very first quest.", emoji: "🌱", tier: "bronze" },
  { key: "quests_10", name: "Quest Regular", description: "10 quests approved.", emoji: "🎯", tier: "bronze" },
  { key: "quests_50", name: "Quest Master", description: "50 quests approved.", emoji: "🏹", tier: "silver" },
  { key: "quests_100", name: "Quest Legend", description: "100 quests approved.", emoji: "👑", tier: "gold" },
  { key: "points_25", name: "First Spark", description: "Earned 25 lifetime points.", emoji: "✨", tier: "bronze" },
  { key: "points_50", name: "Warm Glow", description: "Earned 50 lifetime points.", emoji: "🌟", tier: "bronze" },
  { key: "points_75", name: "Nest Helper", description: "Earned 75 lifetime points.", emoji: "🪺", tier: "bronze" },
  { key: "points_100", name: "Century", description: "Earned 100 lifetime points.", emoji: "💯", tier: "bronze" },
  { key: "points_150", name: "Trail Scout", description: "Earned 150 lifetime points.", emoji: "🧭", tier: "bronze" },
  { key: "points_200", name: "Star Collector", description: "Earned 200 lifetime points.", emoji: "⭐", tier: "silver" },
  { key: "points_250", name: "Brave Heart", description: "Earned 250 lifetime points.", emoji: "❤️", tier: "silver" },
  { key: "points_350", name: "Quest Knight", description: "Earned 350 lifetime points.", emoji: "🛡️", tier: "silver" },
  { key: "points_500", name: "High Roller", description: "Earned 500 lifetime points.", emoji: "💎", tier: "silver" },
  { key: "points_750", name: "Sky Writer", description: "Earned 750 lifetime points.", emoji: "🌈", tier: "gold" },
  { key: "points_1000", name: "Treasure Hoard", description: "Earned 1,000 lifetime points.", emoji: "🏆", tier: "gold" },
  { key: "points_1500", name: "Myth Maker", description: "Earned 1,500 lifetime points.", emoji: "🐉", tier: "gold" },
  { key: "points_2000", name: "Nest Champion", description: "Earned 2,000 lifetime points.", emoji: "🥇", tier: "gold" },
  { key: "points_3000", name: "Galaxy Kid", description: "Earned 3,000 lifetime points.", emoji: "🪐", tier: "gold" },
  { key: "points_5000", name: "Forever Nest", description: "Earned 5,000 lifetime points.", emoji: "👑", tier: "gold" },
  { key: "streak_3", name: "Warming Up", description: "3-day streak.", emoji: "🔥", tier: "bronze" },
  { key: "streak_7", name: "On Fire", description: "7-day streak.", emoji: "🌋", tier: "silver" },
  { key: "streak_14", name: "Two-Week Flame", description: "14-day streak.", emoji: "🔥", tier: "silver" },
  { key: "streak_30", name: "Unstoppable", description: "30-day streak.", emoji: "☄️", tier: "gold" },
  { key: "first_reward", name: "Shopper", description: "Redeemed your first reward.", emoji: "🛍️", tier: "bronze" },
  { key: "helper", name: "Weekend Helper", description: "10 quests approved.", emoji: "🤝", tier: "bronze" },
];

export const BADGE_MAP = Object.fromEntries(BADGES.map((b) => [b.key, b])) as Record<string, BadgeDef>;

/** Lifetime-point trophies — earned from total earned, not the banked balance. */
export const LIFETIME_BADGE_THRESHOLDS: { key: string; points: number }[] = [
  { key: "points_25", points: 25 },
  { key: "points_50", points: 50 },
  { key: "points_75", points: 75 },
  { key: "points_100", points: 100 },
  { key: "points_150", points: 150 },
  { key: "points_200", points: 200 },
  { key: "points_250", points: 250 },
  { key: "points_350", points: 350 },
  { key: "points_500", points: 500 },
  { key: "points_750", points: 750 },
  { key: "points_1000", points: 1000 },
  { key: "points_1500", points: 1500 },
  { key: "points_2000", points: 2000 },
  { key: "points_3000", points: 3000 },
  { key: "points_5000", points: 5000 },
];

export function lifetimeBadgeKeys(lifetimePoints: number) {
  return LIFETIME_BADGE_THRESHOLDS.filter((b) => lifetimePoints >= b.points).map((b) => b.key);
}
