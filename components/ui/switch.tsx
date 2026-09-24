"use client";

import { cn } from "cn";

export function Switch({
  className,
  size = "default",
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  id,
  name,
}: {
  className?: string;
  size?: "sm" | "default";
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
}) {
  const large = size === "default";
  return (
    <label
      className={cn("relative inline-flex shrink-0 cursor-pointer items-center", disabled && "cursor-not-allowed opacity-50", className)}
      style={{ touchAction: "manipulation" }}
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        role="switch"
        className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={(event) => onCheckedChange?.(event.target.checked)}
      />
      <span
        className={cn(
          "rounded-full border border-transparent bg-input transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-checked:bg-primary",
          large ? "h-[18px] w-8" : "h-3.5 w-6"
        )}
      />
      <span
        className={cn(
          "pointer-events-none absolute rounded-full bg-foreground transition-transform peer-checked:bg-primary-foreground",
          large
            ? "top-[1px] left-[1px] size-4 peer-checked:translate-x-[14px]"
            : "top-[1px] left-[1px] size-3 peer-checked:translate-x-[10px]"
        )}
      />
    </label>
  );
}
