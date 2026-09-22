"use client";

import { useState } from "react";
import { MenuIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#faq", label: "FAQ" },
];

export function MarketingMobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="text-white hover:bg-white/10 hover:text-white"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <XIcon /> : <MenuIcon />}
      </Button>
      {open ? (
        <nav className="absolute top-16 right-4 left-4 z-50 rounded-2xl border border-white/10 bg-nest-950/95 p-3 shadow-lg backdrop-blur">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
