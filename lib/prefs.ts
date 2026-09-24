"use client";

export type NestPrefs = {
  sounds: boolean;
  highContrast: boolean;
  bigType: boolean;
  /** Soft background loop while on the kid screens. Off by default. */
  ambient: boolean;
  /** Mirror the PIN pad / big buttons for left-handed kids. */
  leftHanded: boolean;
  /** Extra-large tap targets. */
  bigTap: boolean;
  /** Add pattern textures so status isn't color-only. */
  colorPatterns: boolean;
  quietStart: string;
  quietEnd: string;
};

const KEY = "qn_prefs";

const DEFAULTS: NestPrefs = {
  sounds: true,
  highContrast: false,
  bigType: false,
  ambient: false,
  leftHanded: false,
  bigTap: false,
  colorPatterns: false,
  quietStart: "20:30",
  quietEnd: "07:00",
};

export function readPrefs(): NestPrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<NestPrefs>) };
  } catch {
    return DEFAULTS;
  }
}

export function writePrefs(next: Partial<NestPrefs>) {
  const merged = { ...readPrefs(), ...next };
  window.localStorage.setItem(KEY, JSON.stringify(merged));
  applyPrefs(merged);
  window.dispatchEvent(new Event("qn-prefs"));
  return merged;
}

export function applyPrefs(prefs: NestPrefs = readPrefs()) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("qn-high-contrast", prefs.highContrast);
  root.classList.toggle("qn-big-type", prefs.bigType);
  root.classList.toggle("qn-left-handed", prefs.leftHanded);
  root.classList.toggle("qn-big-tap", prefs.bigTap);
  root.classList.toggle("qn-color-patterns", prefs.colorPatterns);
  root.dataset.qnSounds = prefs.sounds ? "1" : "0";
  root.dataset.qnAmbient = prefs.ambient ? "1" : "0";
}

export function inQuietHours(prefs: NestPrefs = readPrefs(), now = new Date()) {
  const [sh, sm] = prefs.quietStart.split(":").map(Number);
  const [eh, em] = prefs.quietEnd.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  if (start === end) return false;
  return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

export function chalkboardKey(familyId: string) {
  return `qn_chalkboard_${familyId}`;
}
