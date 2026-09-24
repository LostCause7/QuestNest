"use client";

import { useEffect } from "react";
import { applyPrefs, inQuietHours, readPrefs } from "@/lib/prefs";
import { startAmbient, stopAmbient } from "@/lib/sound";

export function KidDeviceChrome() {
  useEffect(() => {
    const sync = () => {
      const prefs = readPrefs();
      applyPrefs(prefs);
      const bedtime = inQuietHours(prefs);
      document.documentElement.classList.remove("qn-bedtime");
      if (prefs.ambient && prefs.sounds && !bedtime) startAmbient();
      else stopAmbient();
    };
    sync();
    // Browsers only let audio start after a gesture; retry on the first tap.
    const onFirstTap = () => {
      sync();
      window.removeEventListener("pointerdown", onFirstTap);
    };
    window.addEventListener("pointerdown", onFirstTap);
    const t = window.setInterval(sync, 60_000);
    window.addEventListener("qn-prefs", sync);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("qn-prefs", sync);
      window.removeEventListener("pointerdown", onFirstTap);
      stopAmbient();
    };
  }, []);
  return null;
}
