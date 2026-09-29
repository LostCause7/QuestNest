"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Refreshes when any kid in the nest changes their Closet look. */
export function FamilyLooksRealtime({ familyId }: { familyId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 200);
    };

    const channel = supabase
      .channel(`family-looks-${familyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "children", filter: `family_id=eq.${familyId}` }, refresh)
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [familyId, router]);

  return null;
}
