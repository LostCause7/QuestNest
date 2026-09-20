import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getClaims } from "@/lib/supabase/server";

export async function SiteHeader() {
  const claims = await getClaims();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-nest-950/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/">
          <Logo tone="light" size="sm" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a href="#how" className="hover:text-white">
            How it works
          </a>
          <a href="#features" className="hover:text-white">
            Features
          </a>
          <a href="#faq" className="hover:text-white">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {claims ? (
            <Button asChild className="bg-sun-500 text-nest-950 hover:bg-sun-400">
              <Link href="/app">Open my nest</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="bg-sun-500 text-nest-950 hover:bg-sun-400">
                <Link href="/signup">Get started free</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
