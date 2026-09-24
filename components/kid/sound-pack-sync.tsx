"use client";

import { useEffect } from "react";
import { setSoundPack } from "@/lib/sound";
import { setConfettiStyle } from "@/lib/confetti";
import { clearRoom, setRoom } from "@/lib/room";

/**
 * Mirrors the active kid's equipped sound pack, confetti style and room onto
 * <html data-*> so any client component (and CSS) can read them.
 */
export function SoundPackSync({ pack, room, confetti }: { pack?: string | null; room?: string | null; confetti?: string | null }) {
  useEffect(() => {
    setSoundPack(pack);
    setConfettiStyle(confetti);
    setRoom(room);
    return () => {
      setSoundPack(null);
      setConfettiStyle(null);
      clearRoom();
    };
  }, [pack, room, confetti]);
  return null;
}
