"use client";

import { useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AvatarPicker, ColorPicker, KidAvatar } from "@/components/shared/avatar-picker";
import { PinInput } from "@/components/shared/pin-input";
import { completeOnboarding, type OnboardingInput } from "@/lib/actions/onboarding";
import {
  AGE_BANDS,
  CHORE_PACKS,
  REWARD_PACK,
  CURRENCY_PRESETS,
  type AgeBand,
  type ChoreTemplate,
  type RewardTemplate,
} from "@/lib/templates";
import { describeSchedule } from "@/lib/schedule";
import { cn } from "@/lib/utils";

const STEPS = ["Your nest", "First kid", "Starter quests", "Reward shop"] as const;

type Props = { defaultName: string };

export function OnboardingWizard({ defaultName }: Props) {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();

  const [familyName, setFamilyName] = useState(defaultName ? `The ${defaultName} Nest` : "");
  const [currency, setCurrency] = useState(CURRENCY_PRESETS[0]);
  const [customCurrency, setCustomCurrency] = useState(false);

  const [kidName, setKidName] = useState("");
  const [avatar, setAvatar] = useState("fox");
  const [color, setColor] = useState("sky");
  const [pin, setPin] = useState("");

  const [band, setBand] = useState<AgeBand>("middle");
  const [choreSelection, setChoreSelection] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CHORE_PACKS.middle.map((c) => [c.title, true]))
  );
  const [rewardSelection, setRewardSelection] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(REWARD_PACK.map((r) => [r.title, true]))
  );

  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC", []);

  const chores = CHORE_PACKS[band];
  const selectedChores = chores.filter((c) => choreSelection[c.title]);
  const selectedRewards = REWARD_PACK.filter((r) => rewardSelection[r.title]);

  const changeBand = (b: AgeBand) => {
    setBand(b);
    setChoreSelection(Object.fromEntries(CHORE_PACKS[b].map((c) => [c.title, true])));
  };

  const canNext = [
    familyName.trim().length > 0 && currency.name.trim().length > 0 && currency.emoji.trim().length > 0,
    kidName.trim().length > 0 && /^\d{4}$/.test(pin),
    true,
    true,
  ][step];

  const finish = () => {
    const payload: OnboardingInput = {
      familyName: familyName.trim(),
      currencyName: currency.name.trim(),
      currencyEmoji: currency.emoji.trim(),
      timezone,
      child: { name: kidName.trim(), avatar, color, pin },
      chores: selectedChores.map((c: ChoreTemplate) => ({
        title: c.title,
        icon: c.icon,
        points: c.points,
        recurrence: c.recurrence,
        days_of_week: c.days_of_week,
        requires_approval: c.requires_approval,
      })),
      rewards: selectedRewards.map((r: RewardTemplate) => ({
        title: r.title,
        icon: r.icon,
        cost: r.cost,
        category: r.category,
      })),
    };
    startTransition(async () => {
      const res = await completeOnboarding(payload);
      if (res?.error) toast.error(res.error);
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Stepper */}
      <ol className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  done
                    ? "bg-success text-success-foreground"
                    : active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {done ? <CheckIcon className="size-4" /> : i + 1}
              </span>
              <span className={cn("hidden text-sm sm:block", active ? "font-medium" : "text-muted-foreground")}>
                {label}
              </span>
              {i < STEPS.length - 1 ? <span className="ml-2 h-px flex-1 bg-border" /> : null}
            </li>
          );
        })}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
          className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8"
        >
          {step === 0 ? (
            <div className="space-y-6">
              <header>
                <h2 className="font-display text-2xl font-semibold">Name your nest</h2>
                <p className="text-muted-foreground">Pick a family name and the currency your kids will earn.</p>
              </header>
              <div className="space-y-2">
                <Label htmlFor="familyName">Family name</Label>
                <Input
                  id="familyName"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="The Rivera Nest"
                  autoFocus
                />
              </div>
              <div className="space-y-3">
                <Label>Currency</Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {CURRENCY_PRESETS.map((p) => {
                    const selected = !customCurrency && currency.name === p.name;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          setCustomCurrency(false);
                          setCurrency(p);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-sm transition-all hover:border-primary/40",
                          selected ? "border-primary bg-primary/5" : "border-border"
                        )}
                      >
                        <span className="text-2xl">{p.emoji}</span>
                        {p.name}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setCustomCurrency((v) => !v)}
                >
                  {customCurrency ? "Use a preset instead" : "Or make up your own"}
                </button>
                {customCurrency ? (
                  <div className="grid grid-cols-[5rem_1fr] gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="emoji" className="text-xs">
                        Emoji
                      </Label>
                      <Input
                        id="emoji"
                        value={currency.emoji}
                        onChange={(e) => setCurrency((c) => ({ ...c, emoji: e.target.value }))}
                        className="text-center text-xl"
                        maxLength={4}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="cname" className="text-xs">
                        Name (plural)
                      </Label>
                      <Input
                        id="cname"
                        value={currency.name}
                        onChange={(e) => setCurrency((c) => ({ ...c, name: e.target.value }))}
                        placeholder="Dragon Scales"
                        maxLength={20}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-6">
              <header className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-semibold">Add your first kid</h2>
                  <p className="text-muted-foreground">You can add more later. They&apos;ll use the PIN to enter Kid Mode.</p>
                </div>
                <KidAvatar avatar={avatar} color={color} size="lg" className="animate-pop" />
              </header>
              <div className="space-y-2">
                <Label htmlFor="kidName">Name</Label>
                <Input
                  id="kidName"
                  value={kidName}
                  onChange={(e) => setKidName(e.target.value)}
                  placeholder="Maya"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Avatar</Label>
                <AvatarPicker value={avatar} onChange={setAvatar} color={color} />
              </div>
              <div className="space-y-2">
                <Label>Favorite color</Label>
                <ColorPicker value={color} onChange={setColor} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">4-digit PIN</Label>
                <PinInput id="pin" value={pin} onChange={setPin} masked={false} />
                <p className="text-center text-xs text-muted-foreground">
                  Something they can remember and siblings can&apos;t guess.
                </p>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-6">
              <header>
                <h2 className="font-display text-2xl font-semibold">Pick starter quests</h2>
                <p className="text-muted-foreground">
                  Choose an age band, then untick anything that doesn&apos;t fit. You can edit everything later.
                </p>
              </header>
              <div className="grid gap-2 sm:grid-cols-3">
                {AGE_BANDS.map((b) => (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => changeBand(b.key)}
                    className={cn(
                      "rounded-2xl border-2 p-3 text-left transition-all hover:border-primary/40",
                      band === b.key ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <div className="font-medium">{b.label}</div>
                    <div className="text-xs text-muted-foreground">{b.range}</div>
                  </button>
                ))}
              </div>
              <ul className="divide-y rounded-2xl border">
                {chores.map((c) => (
                  <li key={c.title} className="flex items-center gap-3 p-3">
                    <Checkbox
                      id={`c-${c.title}`}
                      checked={!!choreSelection[c.title]}
                      onCheckedChange={(v) => setChoreSelection((s) => ({ ...s, [c.title]: v === true }))}
                    />
                    <span className="text-xl">{c.icon}</span>
                    <label htmlFor={`c-${c.title}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{c.title}</div>
                      <div className="text-xs text-muted-foreground">{describeSchedule({ recurrence: c.recurrence, days_of_week: c.days_of_week ?? [0, 1, 2, 3, 4, 5, 6] })}</div>
                    </label>
                    <span className="rounded-full bg-sun-300/40 px-2.5 py-1 text-sm font-semibold">
                      +{c.points} {currency.emoji}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-6">
              <header>
                <h2 className="font-display text-2xl font-semibold">Stock the reward shop</h2>
                <p className="text-muted-foreground">
                  Prices are in {currency.name.toLowerCase()}. Tweak them any time.
                </p>
              </header>
              <ul className="grid gap-2 sm:grid-cols-2">
                {REWARD_PACK.map((r) => {
                  const checked = !!rewardSelection[r.title];
                  return (
                    <li key={r.title}>
                      <button
                        type="button"
                        onClick={() => setRewardSelection((s) => ({ ...s, [r.title]: !checked }))}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all",
                          checked ? "border-primary bg-primary/5" : "border-border opacity-70"
                        )}
                      >
                        <span className="text-2xl">{r.icon}</span>
                        <span className="flex-1">
                          <span className="block font-medium">{r.title}</span>
                          <span className="text-xs text-muted-foreground capitalize">{r.category}</span>
                        </span>
                        <span className="rounded-full bg-sun-300/40 px-2.5 py-1 text-sm font-semibold">
                          {r.cost} {currency.emoji}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
                <SparklesIcon className="mr-1 inline size-4 text-sun-500" />
                You&apos;re setting up <strong className="text-foreground">{familyName}</strong> with{" "}
                <strong className="text-foreground">{kidName || "your kid"}</strong>, {selectedChores.length} quests and{" "}
                {selectedRewards.length} rewards.
              </div>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || pending}>
          <ArrowLeftIcon />
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button size="lg" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            Continue
            <ArrowRightIcon />
          </Button>
        ) : (
          <Button size="lg" onClick={finish} disabled={pending}>
            {pending ? <Loader2Icon className="animate-spin" /> : <SparklesIcon />}
            Launch my nest
          </Button>
        )}
      </div>
    </div>
  );
}
