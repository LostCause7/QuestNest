"use client";

/**
 * Tiny event bus for full-screen celebrations. Anything (realtime listener,
 * quest board, shop, closet) can fire `celebrate(...)`; the single
 * <KidCelebrations/> mounted in the kid layout renders it.
 */

export type CelebrationTone = "gold" | "pending" | "shop" | "badge" | "level" | "streak" | "sunrise" | "comeback" | "kudos";

export type CelebrationPayload = {
  title: string;
  subtitle?: string;
  emoji: string;
  points?: number;
  currencyEmoji?: string;
  tone?: CelebrationTone;
  /** Optional colors for the confetti burst. */
  colors?: string[];
  /** Skip the modal; only sound + confetti + toast. */
  quiet?: boolean;
};

export const CELEBRATE_EVENT = "qn-celebrate";
const REPLAY_KEY = "qn_last_celebration";

export function celebrate(payload: CelebrationPayload) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(REPLAY_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent<CelebrationPayload>(CELEBRATE_EVENT, { detail: payload }));
}

/** The most recent celebration this session, for the "replay" button. */
export function lastCelebration(): CelebrationPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(REPLAY_KEY);
    return raw ? (JSON.parse(raw) as CelebrationPayload) : null;
  } catch {
    return null;
  }
}

export function onCelebrate(handler: (p: CelebrationPayload) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<CelebrationPayload>).detail);
  window.addEventListener(CELEBRATE_EVENT, listener);
  return () => window.removeEventListener(CELEBRATE_EVENT, listener);
}
