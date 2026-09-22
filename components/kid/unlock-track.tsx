"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { saveChildFlavor, saveChildStyle } from "@/lib/actions/style";
import {
  LIFETIME_MILESTONES,
  frameClass,
  nextMilestone,
  styleStorageKey,
  unlockedFrames,
  unlockedMilestones,
  unlockedStickers,
  unlockedTitles,
} from "@/lib/milestones";
import { useAction } from "@/hooks/use-action";
import { cn } from "@/lib/utils";
import type { Child, EquippedStyle, Family, FamilyMilestone } from "@/types/database";

export function UnlockTrack({
  child,
  family,
  extras,
}: {
  child: Child;
  family: Family;
  extras: FamilyMilestone[];
}) {
  const { run, pending } = useAction();
  const unlocked = unlockedMilestones(child.lifetime_points, extras);
  const next = nextMilestone(child.lifetime_points, extras);
  const titles = unlockedTitles(child.lifetime_points, extras);
  const frames = unlockedFrames(child.lifetime_points, extras);
  const stickers = unlockedStickers(child.lifetime_points, extras);
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
  const [motto, setMotto] = useState(child.motto ?? "");

  const persist = (nextStyle: EquippedStyle) => {
    setStyle(nextStyle);
    try {
      window.localStorage.setItem(styleStorageKey(child.id), JSON.stringify(nextStyle));
    } catch {
      /* ignore */
    }
    void run(() => saveChildStyle(child.id, nextStyle), { silent: true });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-card/80 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold">Lifetime unlocks</h3>
            <p className="text-sm text-muted-foreground">
              These don&apos;t cost {family.currency_name}. They open when you&apos;ve earned enough lifetime{" "}
              {family.currency_emoji} — even if you spent some.
            </p>
          </div>
          <KidAvatar
            avatar={child.avatar}
            color={child.color}
            size="lg"
            frameClassName={frameClass(style.frame)}
            sticker={style.sticker}
          />
        </div>
        {next ? (
          <p className="mt-3 text-sm font-medium">
            Next: {next.icon} {next.name} at {next.points} lifetime {family.currency_emoji} (
            {next.points - child.lifetime_points} to go)
          </p>
        ) : (
          <p className="mt-3 text-sm font-medium">Every lifetime unlock is yours. Incredible.</p>
        )}
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {[...LIFETIME_MILESTONES, ...extras.filter((e) => e.is_active).map((e) => ({
          key: `custom_${e.id}`,
          points: e.lifetime_points,
          name: e.title,
          icon: e.icon,
          title: e.title,
        }))]
          .sort((a, b) => a.points - b.points)
          .map((m) => {
            const has = child.lifetime_points >= m.points;
            return (
              <li
                key={m.key}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-card/80 px-3 py-2.5",
                  has ? "shadow-sm" : "opacity-50 grayscale"
                )}
              >
                <span className="text-2xl">{m.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.points} lifetime {family.currency_emoji}
                    {has ? " · unlocked" : ""}
                  </div>
                </div>
              </li>
            );
          })}
      </ul>

      {unlocked.length ? (
        <div className="space-y-4 rounded-3xl bg-card/80 p-4 shadow-sm">
          <h3 className="font-display text-lg font-semibold">Dress up</h3>
          <p className="text-sm text-muted-foreground">Pick a title, frame, and sticker from what you&apos;ve unlocked.</p>
          <div className="space-y-1.5">
            <Label htmlFor={`motto-${child.id}`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Motto
            </Label>
            <div className="flex gap-2">
              <Input
                id={`motto-${child.id}`}
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                maxLength={80}
                placeholder="Be kind. Be brave."
              />
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
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</div>
            <div className="flex flex-wrap gap-2">
              {titles.map((t) => (
                <Button
                  key={t}
                  type="button"
                  size="sm"
                  variant={style.title === t ? "default" : "outline"}
                  disabled={pending}
                  onClick={() => persist({ ...style, title: t })}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Frame</div>
            <div className="flex flex-wrap gap-2">
              {frames.map((f) => (
                <Button
                  key={f.key}
                  type="button"
                  size="sm"
                  variant={style.frame === f.key ? "default" : "outline"}
                  disabled={pending}
                  onClick={() => persist({ ...style, frame: f.key })}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
          {stickers.length ? (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sticker</div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={!style.sticker ? "default" : "outline"}
                  disabled={pending}
                  onClick={() => persist({ ...style, sticker: null })}
                >
                  None
                </Button>
                {stickers.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant={style.sticker === s ? "default" : "outline"}
                    disabled={pending}
                    onClick={() => persist({ ...style, sticker: s })}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
