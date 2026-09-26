"use client";

import { usePathname } from "next/navigation";

export function SkipLink({ href = "#main" }: { href?: string }) {
  const pathname = usePathname();
  if (pathname === "/kids") return null;

  return (
    <a
      href={href}
      className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:rounded-lg focus-visible:bg-primary focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-primary-foreground"
    >
      Skip to content
    </a>
  );
}
