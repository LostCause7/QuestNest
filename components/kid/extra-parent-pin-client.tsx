"use client";

import { PinScreen } from "@/components/kid/pin-screen";
import { unlockExtraParent } from "@/lib/actions/kid-mode";

export function ExtraParentPinClient({ parentId, header }: { parentId: string; header: React.ReactNode }) {
  return <PinScreen header={header} onSubmit={(pin) => unlockExtraParent(parentId, pin)} />;
}
