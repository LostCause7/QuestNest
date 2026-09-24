"use client";

import { PinScreen } from "@/components/kid/pin-screen";
import { unlockChild } from "@/lib/actions/kid-mode";

export function KidPinClient({ childId, header, color }: { childId: string; header: React.ReactNode; color?: string }) {
  return <PinScreen header={header} color={color} onSubmit={(pin) => unlockChild(childId, pin)} />;
}
