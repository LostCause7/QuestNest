/**
 * Level curve based on lifetime points (XP). Thresholds grow gently so young
 * kids level up often early on and progression stays meaningful later.
 */
const LEVEL_TITLES = [
  "Rookie",
  "Spark",
  "Scout",
  "Ace",
  "Captain",
  "Rival",
  "Pro",
  "Icon",
  "Legend",
  "Mythic",
];

export function xpForLevel(level: number) {
  // level 1 -> 0, level 2 -> 50, level 3 -> 130, level 4 -> 240 ...
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 2; l <= level; l++) total += 50 + (l - 2) * 30;
  return total;
}

export function levelFromXp(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function levelInfo(xp: number) {
  const level = levelFromXp(xp);
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const progress = Math.min(1, Math.max(0, (xp - current) / (next - current)));
  const titleIndex = Math.min(LEVEL_TITLES.length - 1, Math.floor((level - 1) / 2));
  return {
    level,
    title: LEVEL_TITLES[titleIndex],
    xp,
    currentLevelXp: current,
    nextLevelXp: next,
    toNext: next - xp,
    progress,
  };
}
