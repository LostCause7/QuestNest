"use client";

import { useEffect } from "react";

const SKIP =
  "input:not([type]),input[type=text],input[type=email],input[type=password],input[type=search],input[type=tel],input[type=url],input[type=number],input[type=date],input[type=time],input[type=month],input[type=week],input[type=datetime-local],textarea,select,[contenteditable=true]";

const TARGET =
  "button,[role=button],[data-slot=button],label,summary,input[type=checkbox],input[type=radio],input[type=submit],input[type=button]";

function isDisabled(el: HTMLElement) {
  if (el.getAttribute("aria-disabled") === "true") return true;
  if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) return el.disabled;
  return false;
}

type Arm = { el: HTMLElement; at: number; native: boolean; timer: number };

/** If iPad never synthesizes click, fire one. Never cancel touchend. */
export function IosTapBridge() {
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let arm: Arm | null = null;
    let fromBridge = false;

    const unlock = () => {
      for (const node of [document.documentElement, document.body]) {
        if (node.style.pointerEvents === "none") node.style.pointerEvents = "";
      }
    };

    const targetOf = (event: Event): HTMLElement | null => {
      const raw = event.target;
      if (!(raw instanceof Element)) return null;
      if (raw.closest(SKIP)) return null;
      const el = raw.closest(TARGET);
      return el instanceof HTMLElement ? el : null;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      startX = event.clientX;
      startY = event.clientY;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      if (Math.hypot(event.clientX - startX, event.clientY - startY) > 16) return;
      const el = targetOf(event);
      if (!el || isDisabled(el)) return;
      if (arm) window.clearTimeout(arm.timer);
      const rec: Arm = { el, at: Date.now(), native: false, timer: 0 };
      rec.timer = window.setTimeout(() => {
        if (arm !== rec || rec.native) return;
        fromBridge = true;
        rec.el.click();
        queueMicrotask(() => {
          fromBridge = false;
        });
      }, 50);
      arm = rec;
    };

    const onClick = (event: MouseEvent) => {
      const el = targetOf(event);
      if (fromBridge) {
        if (arm) arm.native = true;
        return;
      }
      if (!arm || !el || el !== arm.el || Date.now() - arm.at > 500) return;
      if (arm.native) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      arm.native = true;
      window.clearTimeout(arm.timer);
    };

    unlock();
    const id = window.setInterval(unlock, 400);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("click", onClick, true);
    return () => {
      window.clearInterval(id);
      if (arm) window.clearTimeout(arm.timer);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
