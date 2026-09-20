import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/parent/page-header";

export default function KidNotFound() {
  return (
    <EmptyState icon="🔍" title="We couldn't find that kid" description="They may have been removed, or the link is out of date.">
      <Button asChild>
        <Link href="/app/kids">Back to kids</Link>
      </Button>
    </EmptyState>
  );
}
