import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
  /** Kept for existing call sites; the PNG already includes its own tile. */
  tone?: "default" | "light";
};

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={1024}
      height={1024}
      className={cn("size-8", className)}
      aria-hidden
      priority
    />
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
      <LogoMark className={sizes.mark} />
      <span
        className={cn(
          "font-display font-semibold tracking-tight",
          sizes.text,
          tone === "light" ? "text-white" : "text-foreground"
        )}
      >
        Chore<span className={tone === "light" ? "text-sky-200" : "text-sky-400"}>Hall</span>
      </span>
    </span>
  );
}
