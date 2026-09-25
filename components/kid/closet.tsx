"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { LockIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { useAction } from "@/hooks/use-action";
import { ConfirmDialog } from "@/components/parent/confirm-dialog";
import { giftLook } from "@/lib/actions/kudos";
import { buyClosetItem, saveChildFlavor, saveChildLook, saveChildStyle } from "@/lib/actions/style";
import { AVATARS, AVATAR_KEYS, COLORS, COLOR_KEYS } from "@/lib/avatars";
import {
  CATALOG,
  closetPrice,
  giftKey,
  isUnlocked,
  itemsOf,
  bannerClassName,
  cosmeticThumb,
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

function unlockedFirst<T>(items: T[], isOpen: (item: T) => boolean) {
  const open = items.filter(isOpen);
  const shut = items.filter((item) => !isOpen(item));
  return [...open, ...shut];
}

export function Closet({
  child,
  family,
  extras,
  badges,
  gifts,
  lockedSlots,
  seasonQuests = 0,
  allAccess = false,
}: {
  child: Child;
  family: Family;
  extras: FamilyMilestone[];
  badges: ChildBadge[];
  gifts: string[];
  lockedSlots: string[];
  seasonQuests?: number;
  allAccess?: boolean;
}) {
  const { run, pending } = useAction();
  const [ownedGifts, setOwnedGifts] = useState(gifts);
  const [cp, setCp] = useState(child.closet_points ?? 0);
  const ctx = useMemo(
    () => unlockContext(child, extras, badges, ownedGifts, seasonQuests),
    [child, extras, badges, ownedGifts, seasonQuests]
  );
  const locked = useMemo(() => new Set(allAccess ? [] : lockedSlots), [allAccess, lockedSlots]);
  const owned = (item: CosmeticItem) => isUnlocked(item, ctx);
  const [tab, setTab] = useState<Tab>("face");
  const [giftTarget, setGiftTarget] = useState<CosmeticItem | null>(null);
  const kidName = child.nickname?.trim() || child.name;
  const [avatar, setAvatar] = useState(child.avatar);
  const [color, setColor] = useState(child.color);
  const [motto, setMotto] = useState(child.motto ?? "");
  const [preview, setPreview] = useState<CosmeticItem | null>(null);
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

  useEffect(() => {
    if (preview?.kind === "room") {
      setRoom(preview.key);
      return () => setRoom(style.room ?? null);
    }
    setRoom(style.room ?? null);
  }, [preview, style.room]);

  useEffect(() => {
    if (preview?.kind === "soundPack") {
      setSoundPack(preview.key);
      return () => setSoundPack(style.soundPack ?? "classic");
    }
  }, [preview, style.soundPack]);

  const titles = allAccess
    ? [...new Set([...unlockedTitles(child.lifetime_points, extras), ...itemsOf("title").map((i) => i.label)])]
    : unlockedTitles(child.lifetime_points, extras);
  const badgeKeys = [...ctx.badges].filter((k) => BADGE_MAP[k]);

  const persistStyle = (next: EquippedStyle) => {
    next = { ...next, hat: null, sticker: null };
    setPreview(null);
    setStyle(next);
    try {
      window.localStorage.setItem(styleStorageKey(child.id), JSON.stringify(next));
    } catch {
      /* ignore */
    }
    play("tap");
    void saveChildStyle(child.id, next).then((res) => {
      if (!res.ok) toast.error(res.error);
    });
  };

  const persistLook = (next: { avatar?: string; color?: string }) => {
    setPreview(null);
    if (next.avatar) setAvatar(next.avatar);
    if (next.color) setColor(next.color);
    play("tap");
    void saveChildLook(child.id, next).then((res) => {
      if (!res.ok) toast.error(res.error);
    });
  };

  const previewEffects = (item: CosmeticItem) => {
    if (item.kind === "soundPack") {
      setSoundPack(item.key);
      setTimeout(() => previewPack(item.key as SoundPack), 80);
    }
    if (item.kind === "confetti") {
      setConfettiStyle(item.key);
      setTimeout(() => burst("small"), 80);
    }
  };

  const showPreview = (item: CosmeticItem) => {
    setPreview(item);
    play("tap");
    previewEffects(item);
  };

  const wearItem = (item: CosmeticItem) => {
    if (item.kind === "face") {
      persistLook({ avatar: item.key });
      return;
    }
    if (item.kind === "color") {
      persistLook({ color: item.key });
      return;
    }
    if (item.kind === "title") {
      persistStyle({ ...style, title: item.label });
      return;
    }
    if (isSlot(item.kind)) {
      equip(item.kind, item.key === "none" ? null : item.key);
    }
  };

  const pickItem = (item: CosmeticItem) => {
    if (!owned(item)) {
      if (allAccess) {
        setGiftTarget(item);
        play("tap");
        return;
      }
      if (preview?.kind === item.kind && preview.key === item.key) {
        setPreview(null);
        play("tap");
        return;
      }
      showPreview(item);
      return;
    }
    wearItem(item);
  };

  const confirmGift = () => {
    if (!giftTarget) return;
    const item = giftTarget;
    void run(() => giftLook(child.id, { kind: item.kind, key: item.key }), {
      onSuccess: () => {
        setOwnedGifts((cur) => [...new Set([...cur, giftKey(item)])]);
        setGiftTarget(null);
        wearItem(item);
      },
    });
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

  const buyPreview = () => {
    if (!preview || allAccess) return;
    const item = preview;
    void run(() => buyClosetItem(child.id, { kind: item.kind, key: item.key }), {
      onSuccess: (data) => {
        setOwnedGifts((cur) => [...new Set([...cur, giftKey(item)])]);
        if (typeof data?.closet_points === "number") setCp(data.closet_points);
        wearItem(item);
      },
    });
  };

  const previewStyle: EquippedStyle = {
    ...style,
    ...(preview?.kind === "title" ? { title: preview.label } : {}),
    ...(preview && isSlot(preview.kind) ? { [preview.kind]: preview.key === "none" ? null : preview.key } : {}),
  };
  const look = childLook(previewStyle);
  const shownAvatar = preview?.kind === "face" ? preview.key : avatar;
  const shownColor = preview?.kind === "color" ? preview.key : color;
  const currency = family.currency_name.toLowerCase();
  const previewCost = preview ? closetPrice(preview) : 0;

  return (
    <div className="space-y-4">
      <div className="sticky top-[5px] z-30 space-y-3 overflow-visible rounded-[1.75rem] bg-background/80 px-1.5 pb-1.5 shadow-[0_12px_28px_-16px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className={cn(bannerClassName(look.banner) || "qn-kid-surface", "flex items-center gap-4 overflow-visible rounded-3xl p-4 shadow-md ring-1 ring-black/5")}>
          <KidAvatar
            avatar={shownAvatar}
            color={shownColor}
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
          </div>
          {allAccess ? null : (
            <div className="shrink-0 rounded-2xl bg-card/80 px-3 py-2 text-right shadow-sm ring-1 ring-black/5">
              <div className="font-display text-2xl font-bold tabular-nums">{cp}</div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Closet Points</div>
            </div>
          )}
        </div>

        {preview && !owned(preview) && !allAccess ? (
          <div className="flex flex-col gap-3 rounded-3xl bg-zinc-950 px-4 py-3 text-sm text-amber-50 shadow-sm ring-1 ring-amber-300/50 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-amber-100">Previewing {preview.label}</div>
              <p className="text-amber-100/80">
                Unlock with {unlockHint(preview, currency).toLowerCase()}, or buy for {previewCost} CP.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button type="button" variant="outline" onClick={() => setPreview(null)}>
                Clear
              </Button>
              <Button type="button" disabled={pending || cp < previewCost} onClick={buyPreview}>
                Buy · {previewCost} CP
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col items-center gap-1.5 pb-1">
          <div className="flex flex-wrap justify-center gap-1.5">
            {TABS.slice(0, 7).map((t) => (
              <TabChip key={t.key} tab={t} active={tab === t.key} onClick={() => setTab(t.key)} />
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {TABS.slice(7).map((t) => (
              <TabChip key={t.key} tab={t} active={tab === t.key} onClick={() => setTab(t.key)} />
            ))}
          </div>
        </div>
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
                selected={shownAvatar === key && !preview}
                disabled={locked.has("face")}
                label={AVATARS[key].label}
                onClick={() => persistLook({ avatar: key })}
              >
                <KidAvatar avatar={key} color={shownColor} size="sm" />
              </Tile>
            ))}
            {unlockedFirst(itemsOf("face"), owned).map((item) => (
              <CatalogTile
                key={item.key}
                item={item}
                unlocked={owned(item)}
                selected={shownAvatar === item.key}
                fresh={fresh.has(giftKey(item))}
                disabled={owned(item) && locked.has("face")}
                currency={currency}
                onClick={() => pickItem(item)}
              >
                <KidAvatar avatar={item.key} color={shownColor} size="sm" />
              </CatalogTile>
            ))}
          </Grid>
        ) : null}

        {tab === "color" ? (
          <Grid>
            {COLOR_KEYS.map((key) => (
              <Tile
                key={key}
                selected={shownColor === key && !preview}
                disabled={locked.has("color")}
                label={COLORS[key].label}
                onClick={() => persistLook({ color: key })}
              >
                <span className={cn("size-10 rounded-full bg-gradient-to-br", COLORS[key].gradient)} />
              </Tile>
            ))}
            {unlockedFirst(itemsOf("color"), owned).map((item) => (
              <CatalogTile
                key={item.key}
                item={item}
                unlocked={owned(item)}
                selected={shownColor === item.key}
                fresh={fresh.has(giftKey(item))}
                disabled={owned(item) && locked.has("color")}
                currency={currency}
                onClick={() => pickItem(item)}
              >
                <span className={cn("size-10 overflow-hidden rounded-full bg-gradient-to-br shadow-inner", item.className)} />
              </CatalogTile>
            ))}
          </Grid>
        ) : null}

        {tab === "title" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {unlockedFirst(itemsOf("title"), owned).map((item) => {
                const open = owned(item);
                const on = (look.title ?? "Rookie") === item.label;
                return (
                  <Button
                    key={item.key}
                    type="button"
                    size="sm"
                    variant={on ? "default" : "outline"}
                    disabled={open && locked.has("title")}
                    title={open ? item.label : `${unlockHint(item, currency)} · ${closetPrice(item)} CP`}
                    onClick={() => pickItem(item)}
                  >
                    {open ? item.label : `${item.label} · ${closetPrice(item)} CP`}
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
                    variant={(look.title ?? titles[0]) === t ? "default" : "outline"}
                    disabled={locked.has("title")}
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
                    disabled={!on && (style.showcase?.length ?? 0) >= 3}
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
            {unlockedFirst(itemsOf(tab), owned).map((item) => {
              const equipped = (preview?.kind === tab ? preview.key : style[tab]) ?? SLOT_DEFAULTS[tab];
              return (
                <CatalogTile
                  key={item.key}
                  item={item}
                  unlocked={owned(item)}
                  selected={equipped === item.key}
                  fresh={fresh.has(giftKey(item))}
                  disabled={owned(item) && locked.has(tab)}
                  currency={currency}
                  onClick={() => pickItem(item)}
                >
                  <Preview item={item} avatar={shownAvatar} color={shownColor} />
                </CatalogTile>
              );
            })}
          </Grid>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(giftTarget)}
        onOpenChange={(o) => !o && setGiftTarget(null)}
        title={`Gift ${giftTarget?.label ?? "this look"}?`}
        description={`This unlocks ${giftTarget?.label ?? "it"} in ${kidName}'s Closet.`}
        confirmLabel={`Gift to ${kidName}`}
        destructive={false}
        pending={pending}
        onConfirm={confirmGift}
      />
    </div>
  );
}

function TabChip({
  tab,
  active,
  onClick,
}: {
  tab: { key: Tab; label: string; emoji: string };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors sm:gap-1.5 sm:px-3 sm:text-sm",
        active ? "bg-primary text-primary-foreground shadow" : "bg-card/80 text-muted-foreground hover:text-foreground"
      )}
    >
      <span aria-hidden="true">{tab.emoji}</span>
      {tab.label}
    </button>
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
          "relative flex h-full w-full flex-col items-center justify-center gap-1.5 overflow-visible rounded-2xl border-2 p-3 pt-5 text-center transition-all",
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
  const price = closetPrice(item);
  return (
    <Tile
      selected={selected}
      disabled={disabled}
      label={item.label}
      onClick={onClick}
      className={cn(!unlocked && "border-dashed bg-muted/30 opacity-80", fresh && unlocked && "qn-shiny")}
    >
      {fresh && unlocked ? <SparklesIcon className="absolute top-1.5 right-1.5 size-3.5 text-sun-500" /> : null}
      <span className={cn("relative", !unlocked && "grayscale")}>
        {children}
        {!unlocked ? <LockIcon className="absolute -right-2 -bottom-1 size-4 rounded-full bg-card p-0.5 text-muted-foreground" /> : null}
      </span>
      {!unlocked ? (
        <span className="text-[10px] leading-tight text-muted-foreground">
          {unlockHint(item, currency)} · {price} CP
        </span>
      ) : null}
    </Tile>
  );
}

function ClosetImage({ item }: { item: CosmeticItem }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={cosmeticThumb(item)} alt="" className="size-10 rounded-xl object-cover shadow-inner" />
  );
}

function Preview({ item, avatar, color }: { item: CosmeticItem; avatar: string; color: string }) {
  switch (item.kind) {
    case "frame":
      return <KidAvatar avatar={avatar} color={color} size="sm" frameClassName={item.className} />;
    case "aura":
      return <KidAvatar avatar={avatar} color={color} size="sm" aura={item.key === "none" ? null : item.key} />;
    case "nameplate":
      return (
        <span className="relative inline-flex items-center justify-center">
          <ClosetImage item={item} />
          <span className={cn("absolute inset-x-0.5 truncate text-center text-[10px] font-semibold", item.className)}>Aa</span>
        </span>
      );
    case "banner":
      return <ClosetImage item={item} />;
    case "color":
      return <span className={cn("size-10 overflow-hidden rounded-full bg-gradient-to-br shadow-inner", item.className)} />;
    case "room":
      return (
        <span className="kid-mode relative size-10 overflow-hidden rounded-xl" data-room={item.key}>
          <span className="qn-kid-sky absolute inset-0" />
          <span className="qn-room-fx absolute inset-0" />
        </span>
      );
    case "soundPack":
    case "confetti":
      return <ClosetImage item={item} />;
    default:
      return item.emoji ? <span className="text-3xl">{item.emoji}</span> : <ClosetImage item={item} />;
  }
}
