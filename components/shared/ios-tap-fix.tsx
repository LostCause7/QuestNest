"use client";

import { useEffect } from "react";

function unlockPointers() {
  document.body.style.removeProperty("pointer-events");
  document.documentElement.style.removeProperty("pointer-events");
}

function isTextField(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) {
    return !["button", "submit", "checkbox", "radio", "reset", "file", "image", "range", "color"].includes(el.type);
  }
  return false;
}

/** iPad WebKit often never fires click after touch. Replay a real click on the control. */
export function IosTapFix() {
  useEffect(() => {
    if (!("ontouchend" in window)) return;
    unlockPointers();

    let start: { x: number; y: number; time: number } | null = null;

    function onStart(event: TouchEvent) {
      if (event.touches.length !== 1) {
        start = null;
        return;
      }
      const t = event.touches[0];
      start = { x: t.clientX, y: t.clientY, time: Date.now() };
    }

    function onEnd(event: TouchEvent) {
      if (!start || event.changedTouches.length !== 1) return;
      const t = event.changedTouches[0];
      if (Math.abs(t.clientX - start.x) > 12 || Math.abs(t.clientY - start.y) > 12) return;
      if (Date.now() - start.time > 600) return;
      if (isTextField(event.target)) return;

      const node = event.target instanceof Element ? event.target : null;
      const el = node?.closest(
        'button, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="switch"], [role="checkbox"], input[type="submit"], input[type="button"], input[type="checkbox"], input[type="radio"], select, summary, label'
      );
      if (!(el instanceof HTMLElement) || el.hasAttribute("disabled")) return;
      if (el instanceof HTMLAnchorElement && el.href && el.getAttribute("role") !== "button") return;

      event.preventDefault();
      el.click();
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: false });
    window.addEventListener("pageshow", unlockPointers);
    document.addEventListener("visibilitychange", unlockPointers);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
      window.removeEventListener("pageshow", unlockPointers);
      document.removeEventListener("visibilitychange", unlockPointers);
    };
  }, []);
  return null;
}
