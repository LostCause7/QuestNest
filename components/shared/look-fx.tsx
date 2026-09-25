import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

const STORM_BOLTS = [
  {
    d: 0,
    cls: "qn-fx-bolt-a",
    main: "M34 4 L38 11 L29 17 L36 23 L24 34 L32 40 L21 51 L31 58 L23 70 L34 78 L26 90",
    forks: ["M24 34 L14 41 L9 52", "M32 40 L44 45 L50 56", "M31 58 L40 64 L38 74"],
  },
  {
    d: 0.9,
    cls: "qn-fx-bolt-b",
    main: "M72 6 L67 14 L76 20 L64 30 L71 37 L58 48 L68 55 L54 67 L63 76 L51 88",
    forks: ["M76 20 L86 26 L90 36", "M58 48 L48 54 L44 66"],
  },
  {
    d: 1.7,
    cls: "qn-fx-bolt-c",
    main: "M16 30 L28 34 L22 42 L40 46 L34 56 L54 60 L48 70 L66 76 L60 88",
    forks: ["M22 42 L12 50 L8 60", "M54 60 L66 62 L72 70"],
  },
  {
    d: 2.4,
    cls: "qn-fx-bolt-d",
    main: "M58 2 L54 10 L62 16 L50 26 L57 33 L45 44 L53 52 L41 64 L50 72 L43 86",
    forks: ["M50 26 L40 30 L36 40", "M53 52 L64 58 L70 68"],
  },
];
const SAKURA_PETALS = [
  { a: 0, d: 0, c: "#f9a8d4" },
  { a: 40, d: 0.4, c: "#fbcfe8" },
  { a: 80, d: 0.8, c: "#f472b6" },
  { a: 120, d: 1.2, c: "#f9a8d4" },
  { a: 160, d: 0.2, c: "#fbcfe8" },
  { a: 200, d: 0.9, c: "#fb7185" },
  { a: 240, d: 1.5, c: "#f9a8d4" },
  { a: 280, d: 0.6, c: "#f472b6" },
  { a: 320, d: 1.1, c: "#fbcfe8" },
  { a: 18, d: 1.8, c: "#fda4af" },
];

const DESIGN_AURAS = new Set([
  "stormcloud",
  "inferno",
  "flower",
  "cyberdata",
  "fairydust",
  "glitch",
  "sakura",
  "holy",
  "voidrift",
]);

export function isDesignAura(key?: string | null) {
  return Boolean(key && DESIGN_AURAS.has(key));
}

export function ornamentFromClass(className?: string | null) {
  const match = className?.match(/qn-ornament-([a-z]+)/);
  return match?.[1] ?? null;
}

export function AuraFx({ aura }: { aura: string }) {
  switch (aura) {
    case "stormcloud":
      return (
        <span className="qn-fx-aura qn-fx-storm" aria-hidden="true">
          <span className="qn-fx-storm-flash" />
          <span className="qn-fx-storm-cloud qn-fx-storm-cloud-a">
            <span />
            <span />
            <span />
            <span />
            <span />
          </span>
          <span className="qn-fx-storm-cloud qn-fx-storm-cloud-b">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span className="qn-fx-storm-cloud qn-fx-storm-cloud-c">
            <span />
            <span />
            <span />
            <span />
          </span>
          {STORM_BOLTS.map((bolt) => (
            <svg
              key={bolt.cls}
              className={cn("qn-fx-bolt-real", bolt.cls)}
              style={{ "--d": `${bolt.d}s` } as CSSProperties}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path className="qn-bolt-glow" d={bolt.main} />
              {bolt.forks.map((d) => (
                <path key={d} className="qn-bolt-glow qn-bolt-fork" d={d} />
              ))}
              <path className="qn-bolt-core" d={bolt.main} />
              {bolt.forks.map((d) => (
                <path key={`${d}-c`} className="qn-bolt-core qn-bolt-fork" d={d} />
              ))}
              <path className="qn-bolt-hot" d={bolt.main} />
            </svg>
          ))}
        </span>
      );
    case "inferno":
    case "flower":
      return (
        <span className="qn-fx-aura qn-fx-inferno" aria-hidden="true">
          <span className="qn-fx-inferno-glow" />
          {Array.from({ length: 18 }, (_, i) => (
            <span
              key={`f-${i}`}
              className="qn-fx-inferno-tongue"
              style={
                {
                  "--a": `${i * 20}deg`,
                  "--d": `${(i % 6) * 0.22}s`,
                  "--s": `${0.78 + (i % 5) * 0.08}`,
                } as CSSProperties
              }
            />
          ))}
          {Array.from({ length: 14 }, (_, i) => (
            <span
              key={`e-${i}`}
              className="qn-fx-inferno-ember"
              style={
                {
                  "--a": `${i * 26 + 8}deg`,
                  "--d": `${(i % 7) * 0.28}s`,
                } as CSSProperties
              }
            />
          ))}
        </span>
      );
    case "cyberdata":
      return <span className="qn-fx-aura qn-fx-cyberdata" aria-hidden="true" />;
    case "fairydust":
      return (
        <span className="qn-fx-aura qn-fx-fairydust" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </span>
      );
    case "glitch":
      return <span className="qn-fx-aura qn-fx-glitch" aria-hidden="true" />;
    case "sakura":
      return (
        <span className="qn-fx-aura qn-fx-sakura" aria-hidden="true">
          {SAKURA_PETALS.map((petal, i) => (
            <span
              key={i}
              className="qn-fx-sakura-orbit"
              style={{ "--a": `${petal.a}deg` } as CSSProperties}
            >
              <span
                style={
                  {
                    "--d": `${petal.d}s`,
                    "--c": petal.c,
                  } as CSSProperties
                }
              />
            </span>
          ))}
        </span>
      );
    case "holy":
      return <span className="qn-fx-aura qn-fx-holy" aria-hidden="true" />;
    case "voidrift":
      return <span className="qn-fx-aura qn-fx-voidrift" aria-hidden="true" />;
    default:
      return null;
  }
}

export function FrameOrnament({ kind }: { kind: string }) {
  const common = "pointer-events-none absolute -inset-[18%] z-[2] overflow-visible";
  switch (kind) {
    case "medieval":
      return (
        <svg className={common} viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <circle cx="50" cy="50" r="42" stroke="#78716c" strokeWidth="3.5" />
          <circle cx="50" cy="50" r="46" stroke="#44403c" strokeWidth="1.5" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <circle key={deg} cx={50 + 44 * Math.cos((deg * Math.PI) / 180)} cy={50 + 44 * Math.sin((deg * Math.PI) / 180)} r="2.2" fill="#a8a29e" stroke="#292524" strokeWidth="0.6" />
          ))}
          <path d="M50 6 L53 14 H47 Z" fill="#a8a29e" stroke="#44403c" />
        </svg>
      );
    case "cyber":
      return (
        <svg className={cn(common, "qn-ornament-spin-slow")} viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <circle cx="50" cy="50" r="43" stroke="#22d3ee" strokeWidth="1.2" strokeDasharray="6 4" />
          <path d="M18 32 L18 18 L32 18" stroke="#f0abfc" strokeWidth="2" />
          <path d="M82 32 L82 18 L68 18" stroke="#22d3ee" strokeWidth="2" />
          <path d="M18 68 L18 82 L32 82" stroke="#22d3ee" strokeWidth="2" />
          <path d="M82 68 L82 82 L68 82" stroke="#f0abfc" strokeWidth="2" />
        </svg>
      );
    case "jewelry":
      return (
        <svg className={common} viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <circle cx="50" cy="50" r="42" stroke="#fbbf24" strokeWidth="2.4" />
          <circle cx="50" cy="50" r="46" stroke="#f59e0b" strokeWidth="1" />
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const x = 50 + 45 * Math.cos((deg * Math.PI) / 180);
            const y = 50 + 45 * Math.sin((deg * Math.PI) / 180);
            return <path key={deg} d={`M${x} ${y - 4} L${x + 3} ${y} L${x} ${y + 4} L${x - 3} ${y} Z`} fill="#fde68a" stroke="#b45309" strokeWidth="0.6" />;
          })}
        </svg>
      );
    case "gems":
      return (
        <svg className={common} viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <circle cx="50" cy="50" r="43" stroke="#c4b5fd" strokeWidth="1.6" />
          <path d="M50 5 L56 14 L50 18 L44 14 Z" fill="#a78bfa" />
          <path d="M86 28 L92 36 L84 40 L80 32 Z" fill="#67e8f9" />
          <path d="M86 72 L92 64 L84 60 L80 68 Z" fill="#f9a8d4" />
          <path d="M14 28 L8 36 L16 40 L20 32 Z" fill="#86efac" />
          <path d="M14 72 L8 64 L16 60 L20 68 Z" fill="#fda4af" />
          <path d="M50 95 L56 86 L50 82 L44 86 Z" fill="#fde047" />
        </svg>
      );
    case "runic":
      return (
        <svg className={common} viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <circle cx="50" cy="50" r="43" stroke="#fbbf24" strokeWidth="1.4" />
          <text x="50" y="12" textAnchor="middle" fill="#fde68a" fontSize="8">ᚠ</text>
          <text x="88" y="54" textAnchor="middle" fill="#fde68a" fontSize="8">ᚱ</text>
          <text x="50" y="96" textAnchor="middle" fill="#fde68a" fontSize="8">ᚦ</text>
          <text x="12" y="54" textAnchor="middle" fill="#fde68a" fontSize="8">ᚨ</text>
        </svg>
      );
    case "laurel":
      return (
        <svg className={common} viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <path d="M22 70 C10 52 18 22 40 16" stroke="#84cc16" strokeWidth="2.4" />
          <path d="M78 70 C90 52 82 22 60 16" stroke="#84cc16" strokeWidth="2.4" />
          <path d="M24 62 C20 54 24 48 30 46" stroke="#a3e635" strokeWidth="1.6" />
          <path d="M76 62 C80 54 76 48 70 46" stroke="#a3e635" strokeWidth="1.6" />
          <path d="M28 50 C26 42 30 36 36 35" stroke="#65a30d" strokeWidth="1.6" />
          <path d="M72 50 C74 42 70 36 64 35" stroke="#65a30d" strokeWidth="1.6" />
        </svg>
      );
    case "stained":
      return (
        <svg className={common} viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <circle cx="50" cy="50" r="44" stroke="#1e293b" strokeWidth="2" />
          <path d="M50 6 L94 50 L50 94 L6 50 Z" stroke="#fbbf24" strokeWidth="1.2" />
          <circle cx="50" cy="8" r="3" fill="#ef4444" />
          <circle cx="92" cy="50" r="3" fill="#3b82f6" />
          <circle cx="50" cy="92" r="3" fill="#22c55e" />
          <circle cx="8" cy="50" r="3" fill="#a855f7" />
        </svg>
      );
    case "dragonscale":
      return (
        <svg className={common} viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <circle cx="50" cy="50" r="43" stroke="#14532d" strokeWidth="2" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
            const x = 50 + 44 * Math.cos((deg * Math.PI) / 180);
            const y = 50 + 44 * Math.sin((deg * Math.PI) / 180);
            return <ellipse key={deg} cx={x} cy={y} rx="4.2" ry="3" transform={`rotate(${deg} ${x} ${y})`} fill="#166534" stroke="#86efac" strokeWidth="0.6" />;
          })}
        </svg>
      );
    case "baroque":
      return (
        <svg className={common} viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <circle cx="50" cy="50" r="42" stroke="#d4af37" strokeWidth="1.8" />
          <path d="M50 4 C56 10 62 12 58 18 C70 14 74 22 66 24 C78 28 70 36 62 30" stroke="#f5d76e" strokeWidth="1.4" fill="none" />
          <path d="M50 96 C44 90 38 88 42 82 C30 86 26 78 34 76 C22 72 30 64 38 70" stroke="#f5d76e" strokeWidth="1.4" fill="none" />
        </svg>
      );
    case "neonhex":
      return (
        <svg className={cn(common, "qn-ornament-pulse")} viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <polygon points="50,8 86,29 86,71 50,92 14,71 14,29" stroke="#4ade80" strokeWidth="2" />
          <polygon points="50,16 80,33 80,67 50,84 20,67 20,33" stroke="#22d3ee" strokeWidth="1" opacity="0.7" />
        </svg>
      );
    default:
      return null;
  }
}
