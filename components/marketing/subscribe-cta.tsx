import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SubscribeCta({
  priceLabel,
  size = "lg",
  variant = "outline",
}: {
  priceLabel?: string | null;
  size?: "default" | "lg" | "sm";
  variant?: "outline" | "default" | "ghost";
}) {
  return (
    <Button asChild size={size} variant={variant} className={size === "lg" ? "h-12 px-6 text-base" : undefined}>
      <Link href="/signup">{priceLabel ? `Try 7 days free · ${priceLabel}` : "Try 7 days free"}</Link>
    </Button>
  );
}
