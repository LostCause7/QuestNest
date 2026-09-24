"use client";

import { DEFAULT_ROOM } from "@/lib/cosmetics";

/** Mirrors the equipped room onto <html data-qn-room> for CSS/components that live outside the kid layout. */
export function setRoom(key: string | null | undefined) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.qnRoom = key || DEFAULT_ROOM;
}

export function clearRoom() {
  if (typeof document === "undefined") return;
  delete document.documentElement.dataset.qnRoom;
}
