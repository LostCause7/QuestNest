"use client";

import { KidAvatar } from "@/components/shared/avatar-picker";
import { nameplateClassName } from "@/lib/cosmetics";
import { childLook, frameClass } from "@/lib/milestones";
import { cn } from "@/lib/utils";
import type { Child, EquippedStyle } from "@/types/database";

type LookChild = Pick<Child, "avatar" | "color"> & { style?: EquippedStyle | null };
type NamedChild = Pick<Child, "name" | "nickname"> & { style?: EquippedStyle | null };

export function childDisplayName(child: Pick<Child, "name" | "nickname">) {
  return child.nickname?.trim() || child.name;
}

export function ChildLookAvatar({
  child,
  size = "md",
  className,
}: {
  child: LookChild;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const look = childLook(child.style);
  return (
    <KidAvatar
      avatar={child.avatar}
      color={child.color}
      size={size}
      aura={size === "xs" ? null : look.aura}
      frameClassName={frameClass(look.frame)}
      className={className}
    />
  );
}

export function ChildLookName({
  child,
  className,
}: {
  child: NamedChild;
  className?: string;
}) {
  const plate = nameplateClassName(childLook(child.style).nameplate);
  return (
    <span className={cn("inline-block max-w-full truncate", className, plate)}>
      {childDisplayName(child)}
    </span>
  );
}
