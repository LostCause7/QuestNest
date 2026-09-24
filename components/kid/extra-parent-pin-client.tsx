import type { ReactNode } from "react";
import { PinScreen } from "@/components/kid/pin-screen";

export function ExtraParentPinClient({
  parentId,
  header,
  draft,
  error,
}: {
  parentId: string;
  header: ReactNode;
  draft: string;
  error?: string | null;
}) {
  return (
    <PinScreen
      header={header}
      draft={draft}
      error={error}
      hidden={{ role: "extra", id: parentId }}
    />
  );
}
