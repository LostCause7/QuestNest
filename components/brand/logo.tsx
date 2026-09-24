import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
  /** Use light strokes on dark backgrounds */
  tone?: "default" | "light";
};

/** The ChoreHall mark: a nest cradling a rising star. */
export function LogoMark({ className, tone = "default" }: LogoMarkProps) {
  const nest = tone === "light" ? "#fff" : "url(#qn-nest)";
  const star = "url(#qn-star)";
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="qn-nest" x1="8" y1="34" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#94a3b8" />
          <stop offset="0.45" stopColor="#64748b" />
          <stop offset="1" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="qn-star" x1="20" y1="6" x2="44" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f8fafc" />
          <stop offset="0.5" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      {/* star */}
      <path
        d="M32 6l4.6 10.2 11.1 1.2-8.3 7.5 2.4 10.9L32 30.2l-9.8 5.6 2.4-10.9-8.3-7.5 11.1-1.2L32 6z"
        fill={star}
      />
      {/* nest */}
      <path
        d="M10 36c0-2.2 1.8-4 4-4h36c2.2 0 4 1.8 4 4v2c0 11-9.8 20-22 20S10 49 10 38v-2z"
        fill={nest}
      />
      <path
        d="M14 38c4-2.5 8.5-3.8 14-3.8M50 38c-4-2.5-8.5-3.8-14-3.8M18 46c3.5-1.6 7.5-2.4 12-2.4M46 46c-3.5-1.6-7.5-2.4-12-2.4M24 53c2.6-1 5.3-1.4 8-1.4s5.4.4 8 1.4"
        stroke={tone === "light" ? "#4b2fc4" : "#fff"}
        strokeOpacity="0.55"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

type LogoProps = {
  className?: string;
  tone?: "default" | "light";
  size?: "sm" | "md" | "lg";
};

export function Logo({ className, tone = "default", size = "md" }: LogoProps) {
  const sizes = {
    sm: { mark: "size-6", text: "text-lg" },
    md: { mark: "size-8", text: "text-xl" },
    lg: { mark: "size-12", text: "text-3xl" },
  }[size];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={sizes.mark} tone={tone} />
      <span
        className={cn(
          "font-display font-semibold tracking-tight",
          sizes.text,
          tone === "light" ? "text-white" : "text-foreground"
        )}
      >
        Chore<span className={tone === "light" ? "text-sky-200" : "text-nest-400"}>Hall</span>
      </span>
    </span>
  );
}
