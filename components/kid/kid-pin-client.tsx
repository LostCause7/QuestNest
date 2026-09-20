"use client";

import { PinScreen } from "@/components/kid/pin-screen";
import { unlockChild } from "@/lib/actions/kid-mode";

export function KidPinClient({ childId, header }: { childId: string; header: React.ReactNode }) {
  return <PinScreen header={header} onSubmit={(pin) => unlockChild(childId, pin)} />;
}
