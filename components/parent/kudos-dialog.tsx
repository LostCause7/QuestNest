"use client";

import { useEffect, useState } from "react";
import { GiftIcon, HeartIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAction } from "@/hooks/use-action";
import { giftLook, sendKudos } from "@/lib/actions/kudos";
import { CATALOG, STYLE_SLOTS, giftKey, type CosmeticItem, type CosmeticKind } from "@/lib/cosmetics";
import { KUDOS_LINES } from "@/lib/copy";
import { cn } from "@/lib/utils";
import type { Child } from "@/types/database";

const KUDOS_EMOJI = ["💖", "👏", "🌟", "🙌", "🦸", "🤗", "🎉", "💪", "🧠", "😂"];

export function KudosDialog({
  child,
  open,
  onOpenChange,
  gifted = [],
}: {
  child: Child | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  gifted?: string[];
}) {
  const { run, pending } = useAction();
  const [emoji, setEmoji] = useState("💖");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"kudos" | "gift">("kudos");
  const [giftKind, setGiftKind] = useState<CosmeticKind>("face");
  const [ownedGifts, setOwnedGifts] = useState(gifted);
  const [giftTarget, setGiftTarget] = useState<CosmeticItem | null>(null);

  useEffect(() => {
    setOwnedGifts(gifted);
  }, [gifted]);

  if (!child) return null;
  const kidName = child.nickname?.trim() || child.name;
  const giftable = CATALOG.filter((i) => i.kind === giftKind && i.unlock.by !== "free");

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) setGiftTarget(null);
          onOpenChange(o);
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Cheer on {kidName}</DialogTitle>
            <DialogDescription>Kudos pop up on their screen right away and stick around for a day. Gifts unlock a Closet look for them.</DialogDescription>
          </DialogHeader>

          <div className="flex gap-1 rounded-full bg-muted p-1">
            <button
              type="button"
              onClick={() => setTab("kudos")}
              className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-semibold", tab === "kudos" ? "bg-card shadow" : "text-muted-foreground")}
            >
              <HeartIcon className="size-4" /> Kudos
            </button>
            <button
              type="button"
              onClick={() => setTab("gift")}
              className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-semibold", tab === "gift" ? "bg-card shadow" : "text-muted-foreground")}
            >
              <GiftIcon className="size-4" /> Gift a look
            </button>
          </div>

          {tab === "kudos" ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => sendKudos(child.id, { emoji, message: message.trim() || null }), {
                  onSuccess: () => {
                    setMessage("");
                    onOpenChange(false);
                  },
                });
              }}
            >
              <div className="flex flex-wrap gap-1.5">
                {KUDOS_EMOJI.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    aria-pressed={emoji === e}
                    className={cn("flex size-10 items-center justify-center rounded-xl border-2 text-xl", emoji === e ? "border-primary bg-primary/10" : "border-border")}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kudos-msg">Say something (optional)</Label>
                <Input id="kudos-msg" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={120} placeholder={KUDOS_LINES[0]} />
                <div className="flex flex-wrap gap-1.5">
                  {KUDOS_LINES.map((l) => (
                    <button key={l} type="button" onClick={() => setMessage(l)} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium hover:bg-accent">
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? <Loader2Icon className="animate-spin" /> : <HeartIcon />}
                Send kudos
              </Button>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                {STYLE_SLOTS.map((s) => (
                  <button
                    key={s.kind}
                    type="button"
                    onClick={() => setGiftKind(s.kind)}
                    className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-semibold", giftKind === s.kind ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {giftTarget ? (
                <div className="rounded-2xl border bg-muted/40 p-4 text-center">
                  <div className="mx-auto mb-2 flex justify-center">
                    <GiftPreview item={giftTarget} />
                  </div>
                  <p className="font-semibold">Gift {giftTarget.label}?</p>
                  <p className="mt-1 text-xs text-muted-foreground">This unlocks it in {kidName}&apos;s Closet.</p>
                  <div className="mt-4 flex gap-2">
                    <Button type="button" variant="ghost" className="flex-1" disabled={pending} onClick={() => setGiftTarget(null)}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      disabled={pending}
                      onClick={() => {
                        const item = giftTarget;
                        void run(() => giftLook(child.id, { kind: item.kind, key: item.key }), {
                          onSuccess: () => {
                            setOwnedGifts((cur) => [...new Set([...cur, giftKey(item)])]);
                            setGiftTarget(null);
                          },
                        });
                      }}
                    >
                      {pending ? <Loader2Icon className="animate-spin" /> : <GiftIcon />}
                      Gift to {kidName}
                    </Button>
                  </div>
                </div>
              ) : (
                <ul className="grid grid-cols-3 gap-2">
                  {giftable.map((item) => {
                    const has = ownedGifts.includes(giftKey(item));
                    return (
                      <li key={item.key}>
                        <button
                          type="button"
                          disabled={pending || has}
                          onClick={() => setGiftTarget(item)}
                          className={cn(
                            "flex w-full flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center text-xs font-semibold",
                            has ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-border hover:border-primary/50"
                          )}
                        >
                          <GiftPreview item={item} />
                          <span className="leading-tight">{item.label}</span>
                          <span className="text-[10px] font-normal text-muted-foreground">{has ? "Unlocked" : "Tap to gift"}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function GiftPreview({ item }: { item: CosmeticItem }) {
  if (item.kind === "frame" || item.kind === "aura") return <span className={cn("size-8 rounded-full bg-muted", item.className)} />;
  if (item.kind === "nameplate") return <span className={cn("font-display text-sm", item.className)}>Abc</span>;
  if (item.kind === "banner") return <span className={cn("h-6 w-10 rounded-md", item.className || "bg-muted")} />;
  if (item.kind === "title") return <span className="text-xs font-bold">{item.label}</span>;
  if (item.kind === "color") return <span className={cn("size-8 rounded-full bg-gradient-to-br", item.className)} />;
  return <span className="text-2xl">{item.emoji ?? "✨"}</span>;
}
