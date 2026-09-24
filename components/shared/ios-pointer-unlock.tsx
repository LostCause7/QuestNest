"use client";

import { useEffect } from "react";

/** Radix remove-scroll can leave html/body pointer-events:none after a dialog. Do not cancel touch events. */
export function IosPointerUnlock() {
  useEffect(() => {
    const unlock = () => {
      for (const el of [document.documentElement, document.body]) {
        if (el.style.pointerEvents === "none") el.style.pointerEvents = "";
      }
    };
    unlock();
    const id = window.setInterval(unlock, 400);
    return () => window.clearInterval(id);
  }, []);
  return null;
}
