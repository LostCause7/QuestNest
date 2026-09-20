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
import { AvatarPicker, ColorPicker, KidAvatar } from "@/components/shared/avatar-picker";
import { PinInput } from "@/components/shared/pin-input";
import { useAction } from "@/hooks/use-action";
import { createChild, updateChild } from "@/lib/actions/children";
import type { Child } from "@/types/database";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  child?: Child | null;
};

export function KidDialog({ open, onOpenChange, child }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {/* Content unmounts on close, so the form state resets each time it opens. */}
        <KidForm key={child?.id ?? "new"} child={child ?? null} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function KidForm({ child, onClose }: { child: Child | null; onClose: () => void }) {
  const editing = Boolean(child);
  const { run, pending } = useAction();

  const [name, setName] = useState(child?.name ?? "");
  const [avatar, setAvatar] = useState(child?.avatar ?? "fox");
  const [color, setColor] = useState(child?.color ?? "sky");
  const [pin, setPin] = useState("");
  const [changePin, setChangePin] = useState(false);

  const pinValid = /^\d{4}$/.test(pin);
  const canSave = name.trim().length > 0 && (editing ? !changePin || pinValid : pinValid);

  const submit = async () => {
    const payload = { name: name.trim(), avatar, color, pin: editing ? (changePin ? pin : undefined) : pin };
    await run(() => (editing && child ? updateChild(child.id, payload) : createChild(payload)), {
      onSuccess: onClose,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-xl">{editing ? `Edit ${child?.name}` : "Add a kid"}</DialogTitle>
        <DialogDescription>
          {editing ? "Update their look or reset their PIN." : "They'll pick this avatar and enter the PIN to start questing."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <KidAvatar avatar={avatar} color={color} size="lg" />
          <div className="flex-1 space-y-2">
            <Label htmlFor="kid-name">Name</Label>
            <Input id="kid-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Maya" autoFocus />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Avatar</Label>
          <AvatarPicker value={avatar} onChange={setAvatar} color={color} />
        </div>
        <div className="space-y-2">
          <Label>Color</Label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>4-digit PIN</Label>
            {editing ? (
              <button type="button" className="text-sm text-primary hover:underline" onClick={() => setChangePin((v) => !v)}>
                {changePin ? "Keep current PIN" : "Reset PIN"}
              </button>
            ) : null}
          </div>
          {!editing || changePin ? (
            <PinInput value={pin} onChange={setPin} masked={false} />
          ) : (
            <p className="text-sm text-muted-foreground">PIN is set. Choose “Reset PIN” to change it.</p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!canSave || pending}>
          {pending ? <Loader2Icon className="animate-spin" /> : null}
          {editing ? "Save changes" : "Add kid"}
        </Button>
      </DialogFooter>
    </>
  );
}
