"use client";

import { ChildLookAvatar, ChildLookName } from "@/components/shared/child-look";
import { useShownKid } from "@/lib/kid-look-store";
import type { Child } from "@/types/database";

export function LiveChildAvatar({
  child,
  size,
  className,
}: {
  child: Child;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  return <ChildLookAvatar child={useShownKid(child)} size={size} className={className} />;
}

export function LiveChildName({ child, className }: { child: Child; className?: string }) {
  return <ChildLookName child={useShownKid(child)} className={className} />;
}
