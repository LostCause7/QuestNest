/**
 * All the fun little strings in one place so they're easy to tune (and so the
 * same praise never shows twice in a row on one screen).
 */

export const PRAISE = ["Nailed it!", "Boom!", "Legendary!", "You rock!", "Way to go!", "Superstar!", "Crushed it!", "Ka-pow!", "High five!", "Unstoppable!"];

export const ALL_DONE = ["All quests done!", "Board cleared!", "Nest is tidy!", "Champion of today!"];

export const EMPTY_DAY = ["No quests today!", "A free day!", "Rest-up day!"];

export const GREETINGS: Record<"morning" | "afternoon" | "evening" | "night", string[]> = {
  morning: ["Good morning", "Rise and shine", "Morning, hero"],
  afternoon: ["Good afternoon", "Hey there", "Welcome back"],
  evening: ["Good evening", "Evening, champ", "Nice to see you"],
  night: ["Late night", "Still up?", "Sleepy hero"],
};

export const COMBO = ["Combo!", "On fire!", "Double whammy!", "Triple play!"];

export const STREAK_LINES = ["Come back tomorrow to keep it alive.", "That's real momentum.", "Nothing stops you."];

export const KUDOS_LINES = ["Nice one!", "Way to help!", "You're kind.", "Big heart.", "Teamwork!"];

/** Deterministic pick so server and client render the same string. */
export function pick<T>(list: readonly T[], seed: string): T {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}

export function greetingFor(date = new Date()) {
  const h = date.getHours();
  const bucket = h < 5 ? "night" : h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night";
  return pick(GREETINGS[bucket], date.toDateString() + bucket);
}
