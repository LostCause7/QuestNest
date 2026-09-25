import { QUEST_ICON_ART } from "@/lib/quest-icons";

/** Shop icons painted in the same neon object style as Closet Faces (no people or animals). */
export const REWARD_ICON_ART: Record<string, string> = {
  "🎁": "/rewards/gift.png",
  "🎮": "/rewards/game.png",
  "🍕": "/rewards/pizza.png",
  "🌙": "/rewards/moon.png",
  "🍿": "/rewards/popcorn.png",
  "🍦": "/rewards/icecream.png",
  "💵": "/rewards/cash.png",
  "🎉": "/rewards/party.png",
  "🎨": "/rewards/palette.png",
  "🎢": "/rewards/coaster.png",
  "🧁": "/rewards/cupcake.png",
  "🍩": "/rewards/donut.png",
  "🎬": "/rewards/clapper.png",
  "🛼": "/rewards/skates.png",
  "🎪": "/rewards/circus.png",
  "🧩": "/rewards/puzzle.png",
  "📱": "/rewards/phone.png",
  "🎧": "/rewards/headphones.png",
  "🍔": "/rewards/burger.png",
  "🏕️": "/rewards/tent.png",
  "⛺": "/rewards/tent.png",
  "🎳": "/rewards/bowling.png",
  "🛍️": "/rewards/bags.png",
  "⭐": "/rewards/star.png",
  "🚀": "/rewards/rocket.png",
  "🎯": "/rewards/target.png",
  "🪁": "/rewards/kite.png",
  "🎸": "/rewards/guitar.png",
  "🍫": "/rewards/chocolate.png",
  "🍪": "/rewards/cookie.png",
  "🎲": "/rewards/dice.png",
  "🌧️": "/rewards/rain.png",
};

const ICON_ART: Record<string, string> = { ...REWARD_ICON_ART, ...QUEST_ICON_ART };
const ICON_ART_NORM: Record<string, string> = Object.fromEntries(
  Object.entries(ICON_ART).map(([key, src]) => [key.replace(/\uFE0F/g, ""), src])
);

export function rewardIconSrc(icon: string | null | undefined): string | null {
  if (!icon) return null;
  if (icon.startsWith("/rewards/") || icon.startsWith("/quests/") || icon.startsWith("/faces/")) return icon;
  return ICON_ART[icon] ?? ICON_ART_NORM[icon.replace(/\uFE0F/g, "")] ?? null;
}
