"use client";

import confetti from "canvas-confetti";

const COLORS = ["#6d4fe0", "#ffd166", "#ff8a3d", "#34d399", "#f472b6", "#38bdf8"];

export function burst(size: "small" | "big" | "epic" = "small") {
  if (typeof window === "undefined") return;
  if (size === "small") {
    confetti({ particleCount: 60, spread: 60, startVelocity: 35, origin: { y: 0.7 }, colors: COLORS, scalar: 0.9 });
    return;
  }
  if (size === "big") {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: COLORS });
    setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 }, colors: COLORS }), 150);
    setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 }, colors: COLORS }), 300);
    return;
  }
  // epic: a few seconds of rain
  const end = Date.now() + 2500;
  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors: COLORS });
    confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors: COLORS });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

export function starBurst() {
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
