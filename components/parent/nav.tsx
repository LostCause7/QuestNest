"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  SwordsIcon,
  GiftIcon,
  UsersIcon,
  HistoryIcon,
  SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS: { href: string; label: string; icon: LucideIcon; badgeKey?: "approvals" }[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboardIcon, badgeKey: "approvals" },
  { href: "/app/chores", label: "Quests", icon: SwordsIcon },
  { href: "/app/rewards", label: "Rewards", icon: GiftIcon },
  { href: "/app/kids", label: "Kids", icon: UsersIcon },
  { href: "/app/activity", label: "Activity", icon: HistoryIcon },
  { href: "/app/settings", label: "Settings", icon: SettingsIcon },
];

export function isActivePath(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(href + "/");
}

export function SidebarNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "border border-white/25 bg-white/15 text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className={cn("size-4.5", active ? "text-sidebar-primary" : "")} />
            <span className="flex-1">{item.label}</span>
            {item.badgeKey === "approvals" && pendingCount > 0 ? (
              <span className="rounded-full bg-sidebar-primary px-2 py-0.5 text-xs font-semibold text-sidebar-primary-foreground">
                {pendingCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();
  const items = NAV_ITEMS;
  return (
    <nav className="qn-glass-panel fixed inset-x-0 bottom-0 z-40 rounded-none border-x-0 border-b-0 lg:hidden">
      <ul className="grid grid-cols-6" style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}>
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "relative flex min-h-11 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
                {item.label}
                {item.badgeKey === "approvals" && pendingCount > 0 ? (
                  <span className="absolute top-1.5 right-1/2 translate-x-4 rounded-full bg-sun-500 px-1.5 text-[10px] font-bold text-white">
                    {pendingCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
