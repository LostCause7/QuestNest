import type { ReactNode } from "react";
import { DeleteIcon } from "lucide-react";
import { PIN_KEY_ACTION } from "@/lib/pin-key-path";
import { cn } from "@/lib/utils";

const KEY_CLASS =
  "h-16 w-full cursor-pointer rounded-2xl bg-card text-2xl font-semibold shadow-sm select-none [-webkit-tap-highlight-color:transparent]";

function PinKey({
  hidden,
  value,
  className,
  children,
  label,
}: {
  hidden: Record<string, string>;
  value: string;
  className?: string;
  children: ReactNode;
  label?: string;
}) {
  return (
    <form method="POST" action={PIN_KEY_ACTION} autoComplete="off" data-pin-key={value}>
      {Object.entries(hidden).map(([name, field]) => (
        <input key={name} type="hidden" name={name} value={field} />
      ))}
      <input type="hidden" name="key" value={value} />
      <button type="submit" className={cn(KEY_CLASS, className)} aria-label={label}>
        {children}
      </button>
    </form>
  );
}

/** Each key is a normal HTML POST, not a Server Action fetch iPad WebKit drops. */
export function PinPad({ hidden, className }: { hidden: Record<string, string>; className?: string }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  return (
    <div className={cn("qn-pinpad mx-auto grid w-full max-w-xs grid-cols-3 gap-3", className)} style={{ touchAction: "manipulation" }}>
      {keys.map((k) => (
        <PinKey key={k} hidden={hidden} value={k}>
          {k}
        </PinKey>
      ))}
      <div />
      <PinKey hidden={hidden} value="0">
        0
      </PinKey>
      <PinKey hidden={hidden} value="back" className="flex items-center justify-center text-muted-foreground" label="Delete">
        <DeleteIcon className="size-6" />
      </PinKey>
    </div>
  );
}
