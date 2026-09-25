"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LockIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { useAction } from "@/hooks/use-action";
import { saveChildFlavor, saveChildLook, saveChildStyle } from "@/lib/actions/style";
import { AVATARS, AVATAR_KEYS, COLORS, COLOR_KEYS } from "@/lib/avatars";
import {
  CATALOG,
  giftKey,
  isUnlocked,
  itemsOf,
  bannerClassName,
  nameplateClassName,
  unlockContext,
  unlockHint,
  type CosmeticItem,
  type CosmeticKind,
} from "@/lib/cosmetics";
import { BADGE_MAP } from "@/lib/badges";
import { childLook, frameClass, styleStorageKey, unlockedTitles } from "@/lib/milestones";
import { play, previewPack, setSoundPack, type SoundPack } from "@/lib/sound";
import { burst, setConfettiStyle } from "@/lib/confetti";
import { setRoom } from "@/lib/room";
import { cn } from "@/lib/utils";
import type { Child, ChildBadge, EquippedStyle, Family, FamilyMilestone } from "@/types/database";

type Tab = "face" | "color" | "title" | CosmeticKind | "showcase";

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: "face", label: "Face", emoji: "🙂" },
  { key: "color", label: "Color", emoji: "🎨" },
  { key: "frame", label: "Frame", emoji: "⭕" },
  { key: "aura", label: "Aura", emoji: "✨" },
  { key: "nameplate", label: "Name", emoji: "🏷️" },
  { key: "banner", label: "Banner", emoji: "🪟" },
  { key: "title", label: "Title", emoji: "🎖️" },
  { key: "showcase", label: "Trophies", emoji: "🏆" },
  { key: "room", label: "Room", emoji: "🏠" },
  { key: "soundPack", label: "Sound", emoji: "🔔" },
  { key: "confetti", label: "Confetti", emoji: "🎊" },
];

function seenKey(childId: string) {
  return `qn_seen_${childId}`;
}

type SlotKind = Exclude<CosmeticKind, "face" | "color" | "title" | "sticker" | "hat">;
const SLOT_DEFAULTS: Record<SlotKind, string> = {
  frame: "none",
  aura: "none",
  nameplate: "none",
  banner: "none",
  room: "nest",
  soundPack: "classic",
  confetti: "circle",
};
function isSlot(tab: Tab): tab is SlotKind {
  return tab in SLOT_DEFAULTS;
}

export function Closet({
  child,
  family,
  extras,
  badges,
  gifts,
  lockedSlots,
  seasonQuests = 0,
}: {
  child: Child;
  family: Family;
  extras: FamilyMilestone[];
  badges: ChildBadge[];
  gifts: string[];
  lockedSlots: string[];
  seasonQuests?: number;
}) {
  const { run, pending } = useAction();
  const ctx = useMemo(() => unlockContext(child, extras, badges, gifts, seasonQuests), [child, extras, badges, gifts, seasonQuests]);
  const locked = useMemo(() => new Set(lockedSlots), [lockedSlots]);
  const [tab, setTab] = useState<Tab>("face");
  const [avatar, setAvatar] = useState(child.avatar);
  const [color, setColor] = useState(child.color);
  const [motto, setMotto] = useState(child.motto ?? "");
  const [style, setStyle] = useState<EquippedStyle>(() => {
    if (typeof window === "undefined") return child.style ?? {};
    try {
      const raw = window.localStorage.getItem(styleStorageKey(child.id));
      if (raw) return { ...child.style, ...(JSON.parse(raw) as EquippedStyle) };
    } catch {
      /* keep server style */
    }
    return child.style ?? {};
  });

  // Items that opened since the last visit get a shine.
  const [fresh] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const seen = new Set<string>(JSON.parse(window.localStorage.getItem(seenKey(child.id)) ?? "[]") as string[]);
      const now = CATALOG.filter((i) => isUnlocked(i, ctx) && i.unlock.by !== "free").map(giftKey);
      return new Set(seen.size ? now.filter((k) => !seen.has(k)) : []);
    } catch {
      return new Set();
    }
  });
  useEffect(() => {
    try {
      const now = CATALOG.filter((i) => isUnlocked(i, ctx) && i.unlock.by !== "free").map(giftKey);
      window.localStorage.setItem(seenKey(child.id), JSON.stringify(now));
    } catch {
      /* ignore */
    }
  }, [child.id, ctx]);

  const titles = unlockedTitles(child.lifetime_points, extras);
  const badgeKeys = [...ctx.badges].filter((k) => BADGE_MAP[k]);

  const persistStyle = (next: EquippedStyle) => {
    next = { ...next, hat: null, sticker: null };
    setStyle(next);
    try {
      window.localStorage.setItem(styleStorageKey(child.id), JSON.stringify(next));
    } catch {
      /* ignore */
    }
    play("tap");
    void run(() => saveChildStyle(child.id, next), { silent: true });
  };

  const equip = (kind: SlotKind, key: string | null) => {
    if (kind === "soundPack" && key) {
      setSoundPack(key);
      persistStyle({ ...style, soundPack: key });
      setTimeout(() => previewPack(key as SoundPack), 80);
      return;
    }
    if (kind === "room") setRoom(key);
    if (kind === "confetti") {
      setConfettiStyle(key);
      setTimeout(() => burst("small"), 80);
    }
    persistStyle({ ...style, [kind]: key });
  };

  const look = childLook(style);
  const currency = family.currency_name.toLowerCase();

  return (
    <div className="space-y-5">
      <div className={cn(bannerClassName(look.banner) || "qn-kid-surface", "flex items-center gap-4 rounded-3xl p-4 shadow-md ring-1 ring-black/5")}>
        <KidAvatar
          avatar={avatar}
          color={color}
          size="lg"
          aura={look.aura}
          frameClassName={frameClass(look.frame)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className={cn("truncate font-display text-2xl font-semibold", nameplateClassName(look.nameplate))}>
              {child.nickname?.trim() || child.name}
            </div>
            {(style.showcase ?? []).length ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100/90 px-2 py-0.5 text-lg ring-1 ring-amber-300/60">
                {(style.showcase ?? []).map((k) => {
                  const b = BADGE_MAP[k];
                  return b ? (
                    <span key={k} title={b.name}>
                      {b.emoji}
                    </span>
                  ) : null;
                })}
              </span>
            ) : null}
          </div>
          <div className="text-sm text-muted-foreground">{look.title || "Rookie"}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Pin trophies next to your name. Rooms change the whole page backdrop.
          </p>
        </div>
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
              tab === t.key ? "bg-primary text-primary-foreground shadow" : "bg-card/80 text-muted-foreground hover:text-foreground"
            )}
          >
            <span aria-hidden="true">{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="qn-kid-surface rounded-3xl p-4 shadow-md ring-1 ring-black/5">
        {locked.has(tab) ? (
          <p className="mb-3 flex items-center gap-1.5 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
            <LockIcon className="size-4" /> A parent locked this slot for now.
          </p>
        ) : null}

        {tab === "face" ? (
          <Grid>
            {AVATAR_KEYS.map((key) => (
              <Tile
                key={key}
                selected={avatar === key}
                disabled={pending || locked.has("face")}
                label={AVATARS[key].label}
                onClick={() => {
                  setAvatar(key);
                  play("tap");
                  void run(() => saveChildLook(child.id, { avatar: key }), { silent: true });
                }}
              >
                <KidAvatar avatar={key} color={color} size="sm" />
              </Tile>
            ))}
            {itemsOf("face").map((item) => (
              <CatalogTile
                key={item.key}
                item={item}
                unlocked={isUnlocked(item, ctx)}
                selected={avatar === item.key}
                fresh={fresh.has(giftKey(item))}
                disabled={pending || locked.has("face")}
                currency={currency}
                onClick={() => {
                  setAvatar(item.key);
                  play("tap");
                  void run(() => saveChildLook(child.id, { avatar: item.key }), { silent: true });
                }}
              >
                <KidAvatar avatar={item.key} color={color} size="sm" />
              </CatalogTile>
            ))}
          </Grid>
        ) : null}

        {tab === "color" ? (
          <Grid>
            {COLOR_KEYS.map((key) => (
              <Tile
                key={key}
                selected={color === key}
                disabled={pending || locked.has("color")}
                label={COLORS[key].label}
                onClick={() => {
                  setColor(key);
                  play("tap");
                  void run(() => saveChildLook(child.id, { color: key }), { silent: true });
                }}
              >
                <span className={cn("size-10 rounded-full bg-gradient-to-br", COLORS[key].gradient)} />
              </Tile>
            ))}
            {itemsOf("color").map((item) => (
              <CatalogTile
                key={item.key}
                item={item}
                unlocked={isUnlocked(item, ctx)}
                selected={color === item.key}
                fresh={fresh.has(giftKey(item))}
                disabled={pending || locked.has("color")}
                currency={currency}
                onClick={() => {
                  setColor(item.key);
                  play("tap");
                  void run(() => saveChildLook(child.id, { color: item.key }), { silent: true });
                }}
              >
                <span className={cn("size-10 rounded-full bg-gradient-to-br", item.className)} />
              </CatalogTile>
            ))}
          </Grid>
        ) : null}

        {tab === "title" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {itemsOf("title").map((item) => {
                const open = isUnlocked(item, ctx);
                const on = (style.title ?? "Rookie") === item.label;
                return (
                  <Button
                    key={item.key}
                    type="button"
                    size="sm"
                    variant={on ? "default" : "outline"}
                    disabled={pending || locked.has("title") || !open}
                    title={open ? item.label : unlockHint(item, currency)}
                    onClick={() => persistStyle({ ...style, title: item.label })}
                  >
                    {open ? item.label : `${item.label} · locked`}
                  </Button>
                );
              })}
              {titles
                .filter((t) => !itemsOf("title").some((i) => i.label === t))
                .map((t) => (
                  <Button
                    key={t}
                    type="button"
                    size="sm"
                    variant={(style.title ?? titles[0]) === t ? "default" : "outline"}
                    disabled={pending || locked.has("title")}
                    onClick={() => persistStyle({ ...style, title: t })}
                  >
                    {t}
                  </Button>
                ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`motto-${child.id}`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Motto
              </Label>
              <div className="flex gap-2">
                <Input id={`motto-${child.id}`} value={motto} onChange={(e) => setMotto(e.target.value)} maxLength={80} placeholder="Be kind. Be brave." />
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => run(() => saveChildFlavor(child.id, { motto, nickname: child.nickname ?? undefined }))}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "showcase" ? (
          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              Pin up to three trophies. They show next to your name at the top of every kid page.
            </p>
            <Grid>
              {badgeKeys.map((k) => {
                const b = BADGE_MAP[k];
                const on = (style.showcase ?? []).includes(k);
                return (
                  <Tile
                    key={k}
                    selected={on}
                    disabled={pending || (!on && (style.showcase?.length ?? 0) >= 3)}
                    label={b.name}
                    onClick={() => {
                      const cur = style.showcase ?? [];
                      persistStyle({ ...style, showcase: on ? cur.filter((x) => x !== k) : [...cur, k].slice(0, 3) });
                    }}
                  >
                    <span className="text-3xl">{b.emoji}</span>
                  </Tile>
                );
              })}
              {badgeKeys.length === 0 ? <p className="col-span-full text-sm text-muted-foreground">Earn a trophy first.</p> : null}
            </Grid>
          </div>
        ) : null}

        {isSlot(tab) ? (
          <Grid>
            {itemsOf(tab).map((item) => {
              const equipped = style[tab] ?? SLOT_DEFAULTS[tab];
              return (
                <CatalogTile
                  key={item.key}
                  item={item}
                  unlocked={isUnlocked(item, ctx)}
                  selected={equipped === item.key}
                  fresh={fresh.has(giftKey(item))}
                  disabled={pending || locked.has(tab)}
                  currency={currency}
                  onClick={() => equip(tab, item.key === "none" ? null : item.key)}
                >
                  <Preview item={item} avatar={avatar} color={color} />
                </CatalogTile>
              );
            })}
          </Grid>
        ) : null}
      </div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">{children}</ul>;
}

function Tile({
  selected,
  disabled,
  label,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <li>
      <motion.button
        type="button"
        whileTap={{ scale: 0.94 }}
        disabled={disabled}
        onClick={onClick}
        aria-pressed={selected}
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-center transition-all",
          selected ? "qn-chrome border-white/70" : "qn-glass-panel qn-lift hover:border-white/80",
          disabled && "opacity-60",
          className
        )}
      >
        {children}
        <span className="text-[11px] font-semibold leading-tight">{label}</span>
      </motion.button>
    </li>
  );
}

function CatalogTile({
  item,
  unlocked,
  selected,
  fresh,
  disabled,
  currency,
  onClick,
  children,
}: {
  item: CosmeticItem;
  unlocked: boolean;
  selected: boolean;
  fresh: boolean;
  disabled?: boolean;
  currency: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  if (!unlocked) {
    return (
      <li>
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed bg-muted/40 p-3 text-center opacity-70 grayscale"
          title={unlockHint(item, currency)}
        >
          <span className="relative">
            {children}
            <LockIcon className="absolute -right-2 -bottom-1 size-4 rounded-full bg-card p-0.5 text-muted-foreground" />
          </span>
          <span className="text-[11px] font-semibold leading-tight">{item.label}</span>
          <span className="text-[10px] leading-tight text-muted-foreground">{unlockHint(item, currency)}</span>
        </div>
      </li>
    );
  }
  return (
    <Tile selected={selected} disabled={disabled} label={item.label} onClick={onClick} className={cn(fresh && "qn-shiny")}>
      {fresh ? <SparklesIcon className="absolute top-1.5 right-1.5 size-3.5 text-sun-500" /> : null}
      {children}
    </Tile>
  );
}

function Preview({ item, avatar, color }: { item: CosmeticItem; avatar: string; color: string }) {
  switch (item.kind) {
    case "frame":
      return <KidAvatar avatar={avatar} color={color} size="sm" frameClassName={item.className} />;
    case "aura":
      return <KidAvatar avatar={avatar} color={color} size="sm" aura={item.key === "none" ? null : item.key} />;
    case "nameplate":
      return <span className={cn("font-display text-base font-semibold", item.className)}>Name</span>;
    case "banner":
      return <span className={cn("h-10 w-14 rounded-xl shadow-inner", item.className || "bg-muted")} />;
    case "room":
    case "soundPack":
    case "confetti":
      return <span className="text-3xl">{item.emoji}</span>;
    default:
      return <span className="text-3xl">{item.emoji ?? "•"}</span>;
  }
}