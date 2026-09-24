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
    <nav className="qn-glass-panel fixed inset-x-0 bottom-0 z-40">
      <ul className="mx-auto flex max-w-3xl justify-around gap-2 px-2" style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}>
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-4 py-2.5 text-xs font-semibold transition-all",
                  active
                    ? "qn-chrome text-slate-900 shadow-md"
                    : "bg-white/8 text-foreground/70 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/16 [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground"
                )}
              >
                <Icon className={cn("size-6", active && "animate-pop")} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
