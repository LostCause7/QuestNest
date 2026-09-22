import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/parent/page-header";
import { KidsManager } from "@/components/parent/kids-manager";
import { ManagerFallback } from "@/components/parent/manager-fallback";
import { requireFamily } from "@/lib/data/family";
import { getChildren } from "@/lib/data/parent";

export const metadata: Metadata = { title: "Kids" };

export default async function KidsPage() {
  const family = await requireFamily();
  const kids = await getChildren(family.id, true);
  return (
    <>
      <PageHeader title="Kids" description="Each kid gets an avatar, a color and a PIN for Kid Mode." />
      <Suspense fallback={<ManagerFallback rows={3} />}>
        <KidsManager kids={kids} family={family} />
      </Suspense>
    </>
  );
}
