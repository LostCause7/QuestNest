"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconPicker } from "@/components/shared/icon-picker";
import { useAction } from "@/hooks/use-action";
import { createReward, updateReward, type RewardInput } from "@/lib/actions/rewards";
import { REWARD_ICONS } from "@/lib/templates";
import { suggestRewardCost } from "@/lib/suggested-points";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { cn } from "@/lib/utils";
import type { Child, Family } from "@/types/database";
import type { RewardWithKids } from "@/lib/data/parent";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  reward?: RewardWithKids | null;
  preset?: Partial<RewardInput> | null;
  family: Family;
  kids: Child[];
};

export function RewardDialog({ open, onOpenChange, reward, preset, family, kids }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <RewardForm
          key={reward?.id ?? preset?.title ?? "new"}
          reward={reward ?? null}
          preset={preset ?? null}
          family={family}
          kids={kids}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function RewardForm({
  reward,
  preset,
  family,
  kids,
  onClose,
}: {
  reward: RewardWithKids | null;
  preset: Partial<RewardInput> | null;
  family: Family;
  kids: Child[];
  onClose: () => void;
}) {
  const editing = Boolean(reward);
  const { run, pending } = useAction();
  const src = reward ?? preset;
  const initialStock = reward?.stock ?? preset?.stock ?? null;

  const [title, setTitle] = useState(src?.title ?? "");
  const [description, setDescription] = useState((src && "description" in src && src.description) || "");
  const [icon, setIcon] = useState(src?.icon ?? "🎁");
  const [cost, setCost] = useState(String(src?.cost ?? 50));
  const [limited, setLimited] = useState(initialStock !== null && initialStock !== undefined);
  const [stock, setStock] = useState(String(initialStock ?? 1));
  const [category, setCategory] = useState<RewardInput["category"]>((src?.category as RewardInput["category"]) ?? "privilege");
  const [requiresApproval, setRequiresApproval] = useState(src?.requires_approval ?? true);
  const [rarity, setRarity] = useState<NonNullable<RewardInput["rarity"]> | "common">(
    reward?.rarity === "rare" || reward?.rarity === "epic" || reward?.rarity === "legendary" ? reward.rarity : "common"
  );
  const [childIds, setChildIds] = useState<string[]>(
    reward?.child_ids?.length
      ? reward.child_ids
      : preset?.child_ids?.length
        ? preset.child_ids
        : kids.filter((k) => k.is_active).map((k) => k.id)
  );

  const c = Number.parseInt(cost, 10);
  const s = Number.parseInt(stock, 10);
  const canSave =
    title.trim().length > 0 && Number.isFinite(c) && c >= 0 && childIds.length > 0 && (!limited || (Number.isFinite(s) && s >= 0));
  const toggleKid = (id: string) => setChildIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const submit = async () => {
    const payload: RewardInput = {
      title: title.trim(),
      description: description.trim() || null,
      icon,
      cost: c,
      stock: limited ? s : null,
      category,
      requires_approval: requiresApproval,
      rarity: rarity === "common" ? null : rarity,
      child_ids: childIds,
    };
    await run(() => (editing && reward ? updateReward(reward.id, payload) : createReward(payload)), {
      onSuccess: onClose,
    });
  };

  return (
    <>
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{editing ? "Edit reward" : "New reward"}</DialogTitle>
          <DialogDescription>Anything your kids can spend their {family.currency_name.toLowerCase()} on.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex gap-3">
            <IconPicker value={icon} onChange={setIcon} options={REWARD_ICONS} />
            <div className="flex-1 space-y-2">
              <Label htmlFor="r-title">Reward name</Label>
              <Input
                id="r-title"
                value={title}
                onChange={(e) => {
                  const next = e.target.value;
                  setTitle(next);
                  if (!editing && (!cost || cost === "50")) setCost(String(suggestRewardCost(next)));
                }}
                placeholder="Movie night pick"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="r-desc">Details (optional)</Label>
            <Textarea id="r-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="You choose the movie, we make the popcorn." rows={2} maxLength={300} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="r-cost">Price ({family.currency_name})</Label>
              <div className="relative">
                <Input id="r-cost" type="number" min={0} value={cost} onChange={(e) => setCost(e.target.value)} className="pr-9" />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">{family.currency_emoji}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Put $ in the name (like $5) so kids can pick the amount in $5 steps. About 500 {family.currency_name.toLowerCase()} per $10.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as RewardInput["category"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="privilege">Privilege</SelectItem>
                  <SelectItem value="experience">Experience</SelectItem>
                  <SelectItem value="item">Item</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Shine</Label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: "common", label: "Plain" },
                  { key: "rare", label: "✨ Rare" },
                  { key: "epic", label: "💜 Epic" },
                  { key: "legendary", label: "🌟 Legendary" },
                ] as const
              ).map((r) => (
                <button
                  key={r.key}
                  type="button"
                  aria-pressed={rarity === r.key}
                  onClick={() => setRarity(r.key)}
                  className={cn(
                    "cursor-pointer rounded-full border-2 px-3 py-1.5 text-sm font-medium",
                    rarity === r.key ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">Purely cosmetic: a foil shimmer on the shop card so big rewards feel big.</p>
          </div>

          <div className="flex items-center justify-between rounded-xl border p-3">
            <div className="flex-1">
              <div className="text-sm font-medium">Limited stock</div>
              <div className="text-xs text-muted-foreground">{limited ? "Sold out when the count hits zero." : "Unlimited - can be redeemed any time."}</div>
            </div>
            {limited ? (
              <Input type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} className="mr-3 w-20" aria-label="Stock" />
            ) : null}
            <Switch checked={limited} onCheckedChange={setLimited} />
          </div>

          <div className="space-y-2">
            <Label>Who can buy this</Label>
            {kids.length ? (
              <div className="flex flex-wrap gap-2">
                {kids.map((k) => {
                  const on = childIds.includes(k.id);
                  return (
                    <button
                      key={k.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleKid(k.id)}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-full border-2 py-1 pr-3 pl-1 text-sm font-medium transition-colors",
                        on ? "border-primary bg-primary/5" : "border-border opacity-70"
                      )}
                    >
                      <KidAvatar avatar={k.avatar} color={k.color} size="xs" />
                      {k.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Add a kid first.</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="text-sm font-medium">Needs your approval</div>
              <div className="text-xs text-muted-foreground">
                {requiresApproval ? "Points are held until you approve or decline." : "Redeemed instantly - great for small treats."}
              </div>
            </div>
            <Switch checked={requiresApproval} onCheckedChange={setRequiresApproval} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSave || pending}>
            {pending ? <Loader2Icon className="animate-spin" /> : null}
            {editing ? "Save reward" : "Add to shop"}
          </Button>
        </DialogFooter>
    </>
  );
}
