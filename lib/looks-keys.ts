import { AVATAR_KEYS, COLOR_KEYS } from "@/lib/avatars";
import { itemsOf } from "@/lib/cosmetics";

export const ALL_FACE_KEYS = [...new Set([...AVATAR_KEYS, ...itemsOf("face").map((item) => item.key)])];
export const ALL_COLOR_KEYS = [...new Set([...COLOR_KEYS, ...itemsOf("color").map((item) => item.key)])];

export function isKnownFace(key: string) {
  return ALL_FACE_KEYS.includes(key);
}

export function isKnownColor(key: string) {
  return ALL_COLOR_KEYS.includes(key);
}
