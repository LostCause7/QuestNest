"use client";

import { KidAvatar } from "@/components/shared/avatar-picker";
import { nameplateClassName } from "@/lib/cosmetics";
import { childDisplayName, childLook, frameClass, parseStyle } from "@/lib/milestones";
import { cn } from "@/lib/utils";
import type { Child, EquippedStyle } from "@/types/database";

export { childDisplayName };

type LookChild = Pick<Child, "avatar" | "color"> & { id?: string; style?: EquippedStyle | string | null };
type NamedChild = Pick<Child, "name" | "nickname"> & { id?: string; style?: EquippedStyle | string | null };

export function ChildLookAvatar({
  child,
  size = "md",
  className,
}: {
  child: LookChild;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const look = childLook(parseStyle(child.style));
  const frame = look.frame && look.frame !== "none" ? frameClass(look.frame) : undefined;
  const aura = look.aura && look.aura !== "none" ? look.aura : null;
  return (
    <KidAvatar
      avatar={child.avatar}
      color={child.color}
      size={size}
      aura={aura}
      frameClassName={frame}
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
  const plate = nameplateClassName(childLook(parseStyle(child.style)).nameplate);
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate align-middle",
        plate && "px-2 py-0.5",
        className,
        plate
      )}
    >
      {childDisplayName(child)}
    </span>
  );
}
