"use client";

import { DEFAULT_ROOM } from "@/lib/cosmetics";

export const ROOM_EVENT = "qn-room";

/** Applies the equipped room to kid-mode CSS and notifies the backdrop. */
export function setRoom(key: string | null | undefined) {
  if (typeof document === "undefined") return;
  const room = key || DEFAULT_ROOM;
  document.documentElement.dataset.qnRoom = room;
  document.querySelectorAll<HTMLElement>(".kid-mode").forEach((el) => {
    el.dataset.room = room;
  });
  window.dispatchEvent(new CustomEvent(ROOM_EVENT, { detail: room }));
}

export function clearRoom() {
  if (typeof document === "undefined") return;
  delete document.documentElement.dataset.qnRoom;
  document.querySelectorAll<HTMLElement>(".kid-mode").forEach((el) => {
    delete el.dataset.room;
  });
}
