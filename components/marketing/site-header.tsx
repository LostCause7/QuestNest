import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { MarketingMobileNav } from "@/components/marketing/mobile-nav";
import { getClaims } from "@/lib/supabase/server";

export async function SiteHeader() {
  const claims = await getClaims();
  return (
    <header className="qn-glass-panel sticky top-0 z-40 rounded-none border-x-0 border-t-0">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/">
          <Logo size="sm" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#how" className="hover:text-foreground">
            How it works
          </a>
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#faq" className="hover:text-foreground">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <MarketingMobileNav />
          {claims ? (
            <Button asChild>
              <Link href="/kids">Open ChoreHall</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild variant="outline" className="hidden sm:inline-flex">
                <Link href="/signup">Try free</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
