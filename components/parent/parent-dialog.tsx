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
import { createParentProfile } from "@/lib/actions/parents";

export function ParentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <ParentForm key={open ? "open" : "closed"} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ParentForm({ onClose }: { onClose: () => void }) {
  const { run, pending } = useAction();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("fox");
  const [color, setColor] = useState("slate");
  const [motto, setMotto] = useState("");
  const [pin, setPin] = useState("");
  const pinValid = /^\d{4}$/.test(pin);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-xl">Add a parent</DialogTitle>
        <DialogDescription>
          Extra parents pick this face and enter their own PIN to open Parent HQ. The first parent stays the signed-in
          nest owner.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <KidAvatar avatar={avatar} color={color} size="lg" />
          <div className="flex-1 space-y-2">
            <Label htmlFor="parent-name">Name</Label>
            <Input id="parent-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan" autoFocus />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="parent-motto">Motto</Label>
          <Input
            id="parent-motto"
            value={motto}
            onChange={(e) => setMotto(e.target.value)}
            placeholder="Chief of the nest"
            maxLength={80}
          />
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
          <Label>Their 4-digit PIN</Label>
          <PinInput value={pin} onChange={setPin} masked={false} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button
          disabled={!name.trim() || !pinValid || pending}
          onClick={() =>
            run(() => createParentProfile({ name: name.trim(), avatar, color, motto: motto.trim() || null, pin }), {
              onSuccess: onClose,
            })
          }
        >
          {pending ? <Loader2Icon className="animate-spin" /> : null}
          Add parent
        </Button>
      </DialogFooter>
    </>
  );
}
