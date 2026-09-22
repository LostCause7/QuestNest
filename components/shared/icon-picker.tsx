"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function IconPicker({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex size-14 items-center justify-center rounded-2xl border-2 bg-card text-3xl transition-colors hover:border-primary/50",
            className
          )}
          aria-label="Choose icon"
        >
          {value || "❓"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="grid grid-cols-8 gap-1">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              aria-label={`Icon ${o}`}
              className={cn(
                "flex aspect-square min-h-11 items-center justify-center rounded-lg text-xl hover:bg-muted",
                o === value && "bg-primary/15"
              )}
            >
              {o}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Or paste any emoji"
            className="h-8 text-sm"
            maxLength={8}
          />
          <button
            type="button"
            className="rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-50"
            disabled={!custom.trim()}
            onClick={() => {
              onChange(custom.trim());
              setCustom("");
              setOpen(false);
            }}
          >
            Use
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
