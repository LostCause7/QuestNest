import { rewardIconSrc } from "@/lib/reward-icons";
import { cn } from "@/lib/utils";

export function RewardIcon({
  icon,
  className,
}: {
  icon?: string | null;
  className?: string;
}) {
  const value = icon || "🎁";
  const src = rewardIconSrc(value);
  if (src) {
    return <img src={src} alt="" draggable={false} className={cn("inline-block object-contain", className)} />;
  }
  return <span className={className}>{value}</span>;
}
