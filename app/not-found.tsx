import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <Logo />
      <div className="text-7xl">🧭</div>
      <h1 className="font-display text-3xl font-semibold">This quest doesn&apos;t exist</h1>
      <p className="max-w-sm text-muted-foreground">The page you&apos;re looking for wandered off. Let&apos;s get you back to the nest.</p>
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href="/">Home</Link>
        </Button>
        <Button asChild>
          <Link href="/app">Parent HQ</Link>
        </Button>
      </div>
    </main>
  );
}
