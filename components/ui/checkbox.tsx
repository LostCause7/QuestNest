"use client";

import { CheckIcon } from "lucide-react";
import { cn } from "cn";

export function Checkbox({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  id,
  name,
}: {
  className?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
}) {
  return (
    <label
      className={cn("relative inline-flex size-4 shrink-0 cursor-pointer items-center justify-center", disabled && "cursor-not-allowed opacity-50", className)}
      style={{ touchAction: "manipulation" }}
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={(event) => onCheckedChange?.(event.target.checked)}
      />
      <span className="flex size-4 items-center justify-center rounded-[4px] border border-input transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-checked:border-primary peer-checked:bg-primary [&_svg]:opacity-0 peer-checked:[&_svg]:opacity-100">
        <CheckIcon className="size-3.5 text-primary-foreground" />
      </span>
    </label>
  );
}
