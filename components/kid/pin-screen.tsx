import type { ReactNode } from "react";
import { PinEntry } from "@/components/shared/pin-keyboard";

type Props = {
  header: ReactNode;
  draft: string;
  error?: string | null;
  color?: string;
  hidden: Record<string, string>;
  length?: number;
  variableLength?: boolean;
};

export function PinScreen({ header, draft, error, color, hidden, length = 4, variableLength }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8">
      {header}
      <PinEntry draft={draft} error={error} color={color} hidden={hidden} length={length} variableLength={variableLength} />
    </div>
  );
}
