import { DeleteIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY_CLASS =
  "h-16 w-full cursor-pointer rounded-2xl bg-card text-2xl font-semibold shadow-sm select-none [-webkit-tap-highlight-color:transparent]";

/** Submit buttons only — the parent form decides when a tap is complete enough to POST. */
export function PinPad({ className }: { className?: string }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  return (
    <div className={cn("qn-pinpad mx-auto grid w-full max-w-xs grid-cols-3 gap-3", className)} style={{ touchAction: "manipulation" }}>
      {keys.map((k) => (
        <button key={k} type="submit" name="key" value={k} className={KEY_CLASS}>
          {k}
        </button>
      ))}
      <div />
      <button type="submit" name="key" value="0" className={KEY_CLASS}>
        0
      </button>
      <button
        type="submit"
        name="key"
        value="back"
        className={cn(KEY_CLASS, "flex items-center justify-center text-muted-foreground")}
        aria-label="Delete"
      >
        <DeleteIcon className="size-6" />
      </button>
    </div>
  );
}
