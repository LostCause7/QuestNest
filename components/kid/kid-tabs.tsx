"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SwordsIcon, ShoppingBagIcon, TrophyIcon, ShirtIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KidTabs({ childId }: { childId: string }) {
  const pathname = usePathname();
  const base = `/kids/${childId}`;
  const tabs = [
    { href: base, label: "Quests", icon: SwordsIcon, exact: true },
    { href: `${base}/shop`, label: "Shop", icon: ShoppingBagIcon },
    { href: `${base}/trophies`, label: "Trophies", icon: TrophyIcon },
    { href: `${base}/closet`, label: "Closet", icon: ShirtIcon },
  ];
  return (
    <nav
      className="qn-glass-panel fixed inset-x-3 z-40 overflow-hidden rounded-full p-1 sm:static sm:inset-auto"
      style={{ bottom: "max(0.7rem, env(safe-area-inset-bottom))" }}
    >
      <ul className="mx-auto flex h-12 w-full max-w-3xl items-stretch justify-around gap-0.5 sm:h-10 sm:justify-center sm:gap-2">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex min-w-0 flex-1 sm:flex-none">
              <Link
                href={t.href}
                className={cn(
                  "flex h-full w-full min-w-0 items-center justify-center gap-1 overflow-hidden rounded-full px-1.5 text-[11px] leading-none font-semibold transition-all sm:h-9 sm:w-auto sm:gap-2 sm:px-5 sm:text-sm",
                  active
                    ? "qn-chrome text-slate-900"
                    : "text-foreground/70 hover:bg-white/16 hover:text-foreground"
                )}
              >
                <Icon className={cn("size-4 shrink-0", active && "animate-pop")} />
                <span className="truncate">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
