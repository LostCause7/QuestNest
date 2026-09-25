"use client";

import { useEffect, useState } from "react";
import { ROOM_EVENT } from "@/lib/room";

const FLOATERS: Record<string, string[]> = {
  nest: ["🪺", "🍃", "✨", "🌸"],
  sunrise: ["☀️", "🐦", "☁️", "🌈"],
  forest: ["🌲", "🍄", "🦋", "🌿"],
  ocean: ["🐟", "🫧", "🐚", "🌊"],
  space: ["🪐", "⭐", "🚀", "👽"],
  candy: ["🍬", "🍭", "🧁", "🍓"],
  campfire: ["🔥", "🌲", "🌙", "⭐"],
  night: ["🌙", "⭐", "🦉", "✨"],
  loft: ["🪟", "🛋️", "📚", "☕"],
  studio: ["🎛️", "🎧", "🎹", "✨"],
  arena: ["🏟️", "⚽", "🏀", "🏆"],
  arcade: ["🕹️", "👾", "🎮", "💫"],
  glacier: ["🧊", "❄️", "🏔️", "💎"],
  volcano: ["🌋", "🔥", "🪨", "⚡"],
  dojo: ["🥋", "⚔️", "🎌", "☯️"],
  stacks: ["📚", "✏️", "🧠", "☕"],
  rooftop: ["🌆", "🏙️", "🌙", "✨"],
  circuit: ["💡", "⚡", "🖥️", "🧿"],
  garden: ["🌷", "🦋", "🌿", "🌻"],
  garage: ["🔧", "🏎️", "🛞", "🧰"],
  concert: ["🎤", "🎸", "💜", "✨"],
  locker: ["🏅", "👟", "🎒", "🔔"],
  aurora: ["🌌", "💚", "💜", "✨"],
  desert: ["🏜️", "🌵", "☀️", "🦂"],
  city: ["🏙️", "🚦", "🌃", "✨"],
  raincity: ["🌧️", "☔", "🌃", "💧"],
};

const SPOTS = [
  { top: "7%", left: "5%", size: "text-4xl", delay: "0s" },
  { top: "16%", left: "86%", size: "text-3xl", delay: "-4s" },
  { top: "54%", left: "8%", size: "text-3xl", delay: "-8s" },
  { top: "70%", left: "80%", size: "text-5xl", delay: "-2s" },
  { top: "38%", left: "48%", size: "text-2xl", delay: "-11s" },
  { top: "86%", left: "28%", size: "text-3xl", delay: "-6s" },
];

/** Background layer for the kid's equipped room. */
export function RoomBackdrop({ room: initial }: { room: string }) {
  const [room, setRoom] = useState(initial);
  useEffect(() => setRoom(initial), [initial]);
  useEffect(() => {
    const onRoom = (event: Event) => setRoom((event as CustomEvent<string>).detail);
    window.addEventListener(ROOM_EVENT, onRoom);
    return () => window.removeEventListener(ROOM_EVENT, onRoom);
  }, []);
  const floaters = FLOATERS[room] ?? FLOATERS.nest;

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="qn-kid-sky absolute inset-0" />
      <div className="qn-room-blob-a absolute -top-24 -left-16 size-[28rem] rounded-full opacity-90 blur-3xl" />
      <div className="qn-room-blob-b absolute top-1/4 -right-24 size-[32rem] rounded-full opacity-90 blur-3xl" />
      <div className="qn-room-blob-c absolute -bottom-28 left-[20%] size-[30rem] rounded-full opacity-90 blur-3xl" />
      <div className="qn-room-blob-a absolute top-2/3 right-1/4 size-72 rounded-full opacity-70 blur-3xl" />
      {SPOTS.map((s, i) => (
        <span key={i} className={`qn-floater ${s.size}`} style={{ top: s.top, left: s.left, animationDelay: s.delay }}>
          {floaters[i % floaters.length]}
        </span>
      ))}
    </div>
  );
}
