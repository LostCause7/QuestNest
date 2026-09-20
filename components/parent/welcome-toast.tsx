"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export function WelcomeToast({ familyName }: { familyName: string }) {
  const router = useRouter();
  useEffect(() => {
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.3 } });
    toast.success(`${familyName} is ready!`, {
      description: "Tap “Kid Mode” whenever your kids want to play. Everything else lives here.",
      duration: 7000,
    });
    router.replace("/app");
  }, [familyName, router]);
  return null;
}
