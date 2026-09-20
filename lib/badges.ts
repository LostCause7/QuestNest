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
  { key: "points_100", name: "Century", description: "Earned 100 lifetime points.", emoji: "💯", tier: "bronze" },
  { key: "points_500", name: "High Roller", description: "Earned 500 lifetime points.", emoji: "💎", tier: "silver" },
  { key: "points_1000", name: "Treasure Hoard", description: "Earned 1,000 lifetime points.", emoji: "🏆", tier: "gold" },
  { key: "streak_3", name: "Warming Up", description: "3-day streak.", emoji: "🔥", tier: "bronze" },
  { key: "streak_7", name: "On Fire", description: "7-day streak.", emoji: "🌋", tier: "silver" },
  { key: "streak_30", name: "Unstoppable", description: "30-day streak.", emoji: "☄️", tier: "gold" },
  { key: "first_reward", name: "Shopper", description: "Redeemed your first reward.", emoji: "🛍️", tier: "bronze" },
];

export const BADGE_MAP = Object.fromEntries(BADGES.map((b) => [b.key, b])) as Record<string, BadgeDef>;
