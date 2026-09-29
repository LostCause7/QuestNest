"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { EquippedStyle } from "@/types/database";

export type LiveKidLook = {
  avatar?: string;
  color?: string;
  style?: EquippedStyle;
};

const looks = new Map<string, LiveKidLook>();
const listeners = new Set<() => void>();

function keyFor(childId: string) {
  return `qn_look_${childId}`;
}

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStored(childId: string): LiveKidLook | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.sessionStorage.getItem(keyFor(childId));
    if (!raw) return undefined;
    return JSON.parse(raw) as LiveKidLook;
  } catch {
    return undefined;
  }
}

function writeStored(childId: string, look: LiveKidLook) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(keyFor(childId), JSON.stringify(look));
  } catch {
    /* ignore */
  }
}

export function peekKidLook(childId: string | undefined): LiveKidLook | undefined {
  if (!childId) return undefined;
  return looks.get(childId) ?? readStored(childId);
}

/** Keep Face/Color/Closet style visible on header after leaving Closet. */
export function rememberKidLook(childId: string, patch: LiveKidLook) {
  const prev = looks.get(childId) ?? readStored(childId) ?? {};
  const next: LiveKidLook = {
    avatar: patch.avatar ?? prev.avatar,
    color: patch.color ?? prev.color,
    style: patch.style !== undefined ? patch.style : prev.style,
  };
  looks.set(childId, next);
  writeStored(childId, next);
  emit();
}

export function useLiveKidLook(childId: string | undefined): LiveKidLook | undefined {
  useEffect(() => {
    if (!childId || looks.has(childId)) return;
    const stored = readStored(childId);
    if (!stored) return;
    looks.set(childId, stored);
    emit();
  }, [childId]);

  return useSyncExternalStore(
    subscribe,
    () => (childId ? looks.get(childId) : undefined),
    () => undefined
  );
}
