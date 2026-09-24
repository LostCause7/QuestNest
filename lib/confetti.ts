"use client";

import confetti from "canvas-confetti";
import { prefersReducedMotion } from "@/lib/motion";
import { DEFAULT_CONFETTI } from "@/lib/cosmetics";

const COLORS = ["#6d4fe0", "#ffd166", "#ff8a3d", "#34d399", "#f472b6", "#38bdf8"];

type Shape = confetti.Shape;

const textShapes = new Map<string, Shape>();
function textShape(text: string): Shape | null {
  if (textShapes.has(text)) return textShapes.get(text)!;
  try {
    const shape = confetti.shapeFromText({ text, scalar: 2 });
    textShapes.set(text, shape);
    return shape;
  } catch {
    return null;
  }
}

/** Currently equipped confetti style, mirrored onto <html data-qn-confetti> by the kid layout. */
export function currentConfetti(): string {
  if (typeof document === "undefined") return DEFAULT_CONFETTI;
  return document.documentElement.dataset.qnConfetti || DEFAULT_CONFETTI;
}

export function setConfettiStyle(key: string | null | undefined) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.qnConfetti = key || DEFAULT_CONFETTI;
}

function shapesFor(key = currentConfetti()): { shapes?: Shape[]; scalar?: number } {
  switch (key) {
    case "star":
      return { shapes: ["star"] };
    case "hearts": {
      const s = textShape("❤️");
      return s ? { shapes: [s], scalar: 2 } : {};
    }
    case "sparkles": {
      const s = textShape("✨");
      return s ? { shapes: [s], scalar: 2 } : {};
    }
    case "faces": {
      const s = ["😀", "😎", "🥳"].map(textShape).filter(Boolean) as Shape[];
      return s.length ? { shapes: s, scalar: 2 } : {};
    }
    case "fire": {
      const s = textShape("🔥");
      return s ? { shapes: [s], scalar: 2 } : {};
    }
    case "ice": {
      const s = textShape("❄️");
      return s ? { shapes: [s], scalar: 2 } : {};
    }
    case "bolt": {
      const s = textShape("⚡");
      return s ? { shapes: [s], scalar: 2 } : {};
    }
    case "game": {
      const s = textShape("🎮");
      return s ? { shapes: [s], scalar: 2 } : {};
    }
    default:
      return {};
  }
}

export function burst(size: "small" | "big" | "epic" = "small", colors: string[] = COLORS) {
  if (typeof window === "undefined" || prefersReducedMotion()) return;
  const extra = shapesFor();
  if (size === "small") {
    confetti({ particleCount: 60, spread: 60, startVelocity: 35, origin: { y: 0.7 }, colors, scalar: 0.9, ...extra });
    return;
  }
  if (size === "big") {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors, ...extra });
    setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 }, colors, ...extra }), 150);
    setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 }, colors, ...extra }), 300);
    return;
  }
  // epic: a few seconds of rain
  const end = Date.now() + 2500;
  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors, ...extra });
    confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors, ...extra });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

export function starBurst() {
  if (prefersReducedMotion()) return;
  confetti({
    particleCount: 40,
    spread: 360,
    ticks: 60,
    gravity: 0,
    decay: 0.94,
    startVelocity: 25,
    shapes: ["star"],
    colors: ["#FFE400", "#FFBD00", "#E89400", "#FFCA6C", "#FDFFB8"],
    origin: { y: 0.5 },
  });
}

/** Confetti from a specific on-screen element (e.g. the button that was tapped). */
export function burstFrom(el: Element | null, size: "small" | "big" = "small", colors: string[] = COLORS) {
  if (!el || typeof window === "undefined" || prefersReducedMotion()) return burst(size, colors);
  const r = el.getBoundingClientRect();
  const origin = { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight };
  confetti({ particleCount: size === "big" ? 90 : 40, spread: 70, startVelocity: 30, origin, colors, scalar: 0.9, ...shapesFor() });
}
