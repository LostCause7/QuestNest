import type { ReactNode } from "react";
import { PinPad } from "@/components/shared/pin-pad";
import { PinDots } from "@/components/shared/pin-keyboard";

type Props = {
  header: ReactNode;
  draft: string;
  error?: string | null;
  color?: string;
  hidden: Record<string, string>;
  length?: number;
  variableLength?: boolean;
};

/** Taps post a real form. Typing uses the dots field, which does not cover the keypad. */
export function PinScreen({ header, draft, error, color, hidden, length = 4, variableLength }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8">
      {header}
      <PinDots draft={draft} error={error} color={color} hidden={hidden} length={length} variableLength={variableLength} />
      <PinPad hidden={hidden} />
    </div>
  );
}
