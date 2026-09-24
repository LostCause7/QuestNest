import type { ReactNode } from "react";
import { PinScreen } from "@/components/kid/pin-screen";

export function KidPinClient({
  childId,
  header,
  color,
  draft,
  error,
}: {
  childId: string;
  header: ReactNode;
  color?: string;
  draft: string;
  error?: string | null;
}) {
  return (
    <PinScreen
      header={header}
      color={color}
      draft={draft}
      error={error}
      hidden={{ role: "child", id: childId }}
    />
  );
}
