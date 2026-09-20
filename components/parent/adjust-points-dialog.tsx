"use client";

import { useState } from "react";
import { Loader2Icon, MinusIcon, PlusIcon } from "lucide-react";
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
import { useAction } from "@/hooks/use-action";
import { adjustPoints } from "@/lib/actions/children";
import { cn } from "@/lib/utils";
import type { Child, Family } from "@/types/database";

const QUICK = [5, 10, 25, 50];

export function AdjustPointsDialog({
  open,
  onOpenChange,
  child,
  family,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  child: Child | null;
  family: Family;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {child ? <AdjustForm key={child.id} child={child} family={family} onClose={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function AdjustForm({ child, family, onClose }: { child: Child; family: Family; onClose: () => void }) {
  const { run, pending } = useAction();
  const [mode, setMode] = useState<"bonus" | "deduct">("bonus");
  const [amount, setAmount] = useState("10");
  const [note, setNote] = useState("");

  const n = Number.parseInt(amount, 10);
  const valid = Number.isFinite(n) && n > 0;

  const submit = async () => {
    if (!valid) return;
    await run(() => adjustPoints(child.id, mode === "bonus" ? n : -n, note.trim() || undefined), {
      onSuccess: onClose,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-xl">
          Adjust {child.name}&apos;s {family.currency_name}
        </DialogTitle>
        <DialogDescription>Give a bonus for going above and beyond, or deduct for a missed expectation.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("bonus")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-medium",
              mode === "bonus" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-border"
            )}
          >
            <PlusIcon className="size-4" /> Bonus
          </button>
          <button
            type="button"
            onClick={() => setMode("deduct")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-medium",
              mode === "deduct" ? "border-rose-500 bg-rose-50 text-rose-700" : "border-border"
            )}
          >
            <MinusIcon className="size-4" /> Deduct
          </button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amt">Amount</Label>
          <div className="flex gap-2">
            <Input id="amt" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-28 text-lg" />
            <div className="flex flex-1 gap-1.5">
              {QUICK.map((q) => (
                <Button key={q} type="button" variant={amount === String(q) ? "secondary" : "outline"} size="sm" className="flex-1" onClick={() => setAmount(String(q))}>
                  {q}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">Reason (shown to your kid)</Label>
          <Input
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={mode === "bonus" ? "Helped grandma with groceries" : "Left bike out in the rain"}
            maxLength={120}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          New balance:{" "}
          <strong className="text-foreground">
            {child.points_balance + (valid ? (mode === "bonus" ? n : -n) : 0)} {family.currency_emoji}
          </strong>
        </p>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!valid || pending} variant={mode === "deduct" ? "destructive" : "default"}>
          {pending ? <Loader2Icon className="animate-spin" /> : null}
          {mode === "bonus" ? `Give +${valid ? n : 0}` : `Deduct ${valid ? n : 0}`}
        </Button>
      </DialogFooter>
    </>
  );
}
