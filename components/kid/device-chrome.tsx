"use client";

import { useEffect } from "react";
import { applyPrefs, inQuietHours, readPrefs } from "@/lib/prefs";

export function KidDeviceChrome() {
  useEffect(() => {
    const sync = () => {
      const prefs = readPrefs();
      applyPrefs(prefs);
      document.documentElement.classList.toggle("qn-bedtime", inQuietHours(prefs));
    };
    sync();
    const t = window.setInterval(sync, 60_000);
    window.addEventListener("qn-prefs", sync);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("qn-prefs", sync);
    };
  }, []);
  return null;
}
