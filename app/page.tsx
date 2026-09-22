import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRightIcon,
  SparklesIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  ZapIcon,
  PaletteIcon,
  TrophyIcon,
  GiftIcon,
  CalendarCheckIcon,
  UsersIcon,
  BellRingIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { SiteHeader } from "@/components/marketing/site-header";
import { HeroPreview } from "@/components/marketing/hero-preview";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { getClaims } from "@/lib/supabase/server";
import { getFamily } from "@/lib/data/family";

const steps = [
  {
    n: "01",
    title: "Build your nest",
    body: "Name your family, pick a currency (Stars? Gems? Dragon Scales?) and add each kid with their own avatar and PIN.",
    emoji: "🪺",
  },
  {
    n: "02",
    title: "Create quests & rewards",
    body: "Start from age-based templates or write your own. Set points, schedules, who's assigned and whether you approve.",
    emoji: "🗺️",
  },
  {
    n: "03",
    title: "Kids play, you approve",
    body: "Kids tap their avatar, enter their PIN and check off quests. You approve in one tap and points land instantly.",
    emoji: "🎉",
  },
];

const features = [
  { icon: CalendarCheckIcon, title: "Smart scheduling", body: "Daily, weekdays, weekends or any custom pattern. Today's board builds itself." },
  { icon: ShieldCheckIcon, title: "Approve or auto-award", body: "Choose per quest whether you review it or points land instantly." },
  { icon: GiftIcon, title: "A shop you control", body: "Privileges, treats, experiences. Set prices, limit stock, require approval." },
  { icon: TrophyIcon, title: "Streaks, levels, trophies", body: "Eleven badges and a level curve tuned so little kids level up early and often." },
  { icon: UsersIcon, title: "Netflix-style profiles", body: "One parent login. Kids pick their avatar and PIN on the family tablet or your phone." },
  { icon: BellRingIcon, title: "Live everywhere", body: "Approve on your phone and the kid's screen updates in real time with confetti." },
  { icon: PaletteIcon, title: "Fully customizable", body: "Rename the currency, pick emojis, set your timezone. It's your family's game." },
  { icon: SmartphoneIcon, title: "No downloads", body: "Works in any browser on any device. Add it to the home screen and it feels native." },
];

const faqs = [
  {
    q: "Do my kids need their own accounts?",
    a: "No. You sign in once and kids choose their profile with a 4-digit PIN, just like a streaming app. A separate parent PIN locks them out of your dashboard.",
  },
  {
    q: "What happens when a kid finishes a quest?",
    a: "If the quest needs approval, it lands in your queue and points are awarded when you approve. If not, points land instantly with a celebration.",
  },
  {
    q: "Can I give bonus points or take some away?",
    a: "Yes. From any kid's card you can add a bonus or a deduction with a note that shows up in their activity feed.",
  },
  {
    q: "Is it free?",
    a: "Yes. QuestNest is free for families.",
  },
];

export default async function HomePage() {
  const claims = await getClaims();
  if (claims) {
    const family = await getFamily();
    redirect(family ? "/kids" : "/onboarding");
  }

  return (
    <div className="flex min-h-screen flex-col bg-nest-950 text-white">
      <SiteHeader />

      {/* Hero */}
      <section id="main" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-40 left-1/2 h-[40rem] w-[60rem] -translate-x-1/2 rounded-full bg-nest-600/40 blur-3xl" />
          <div className="absolute top-40 -right-40 size-[30rem] rounded-full bg-sun-500/20 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pt-16 pb-24 lg:grid-cols-2 lg:pt-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
              <SparklesIcon className="size-3.5 text-sun-400" />
              Chores, gamified for real families
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] text-balance sm:text-6xl">
              Chores become quests
              <br />
              <span className="bg-gradient-to-r from-sun-300 to-sun-500 bg-clip-text text-transparent">Kids actually want to do.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/70">
              QuestNest turns your family&apos;s to-do list into a game: points, streaks, a reward shop and trophies. You stay in control
              of every rule. They stay motivated.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 bg-sun-500 px-6 text-base text-nest-950 hover:bg-sun-400">
                <Link href="/signup">
                  Start your nest - it&apos;s free
                  <ArrowRightIcon />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 border-white/20 bg-transparent px-6 text-base text-white hover:bg-white/10 hover:text-white">
                <a href="#how">See how it works</a>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm text-white/60">
              <div className="flex -space-x-2">
                <KidAvatar avatar="fox" color="coral" size="xs" className="ring-2 ring-nest-950" />
                <KidAvatar avatar="unicorn" color="bubblegum" size="xs" className="ring-2 ring-nest-950" />
                <KidAvatar avatar="dino" color="mint" size="xs" className="ring-2 ring-nest-950" />
                <KidAvatar avatar="robot" color="sky" size="xs" className="ring-2 ring-nest-950" />
              </div>
              Set up in about two minutes. No app download.
            </div>
          </div>
          <div className="px-4 pt-6 lg:px-0">
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Up and running before the dishes are dry</h2>
            <p className="mt-3 text-lg text-muted-foreground">Three steps. The onboarding wizard walks you through all of them.</p>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n} className="relative rounded-3xl border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-4xl">{s.emoji}</span>
                  <span className="font-display text-sm font-semibold text-muted-foreground">{s.n}</span>
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Two modes */}
      <section className="bg-background text-foreground">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 lg:grid-cols-2">
          <div className="rounded-3xl bg-nest-gradient p-8 text-white shadow-lg">
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Parent HQ</span>
            <h3 className="mt-4 font-display text-2xl font-semibold">Run the family from one screen</h3>
            <ul className="mt-5 space-y-3 text-white/85">
              {[
                "Approval queue with one-tap approve or send back",
                "Quests with points, schedules and per-kid assignment",
                "Reward shop with prices, stock and approval rules",
                "Bonuses, deductions and a full points ledger",
                "Per-kid profiles: streaks, levels, trophies, history",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <ZapIcon className="mt-1 size-4 shrink-0 text-sun-300" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="kid-mode rounded-3xl bg-background p-8 text-foreground shadow-lg ring-1 ring-black/5">
            <span className="inline-flex rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">Kid Mode</span>
            <h3 className="mt-4 font-display text-2xl font-semibold">Big buttons, bright colors, zero nagging</h3>
            <ul className="mt-5 space-y-3 text-foreground/80">
              {[
                "Pick your avatar, tap in your PIN",
                "Today's quests with a progress bar that fills up",
                "Confetti and praise when you hit “Done!”",
                "A shop that shows what you can afford right now",
                "A trophy room with streaks, levels and badges",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <SparklesIcon className="mt-1 size-4 shrink-0 text-sun-600" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/40 text-foreground">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Everything a family chore chart wishes it was</h2>
            <p className="mt-3 text-lg text-muted-foreground">Designed to feel like a polished app, tuned for how families actually work.</p>
          </div>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.title} className="rounded-3xl border bg-card p-6 shadow-sm">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-background text-foreground">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Questions parents ask</h2>
          <div className="mt-10 divide-y rounded-3xl border bg-card">
            {faqs.map((f) => (
              <details key={f.q} className="group p-6">
                <summary className="cursor-pointer font-display text-lg font-semibold list-none [&::-webkit-details-marker]:hidden">
                  {f.q}
                </summary>
                <p className="mt-2 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -bottom-40 left-1/2 h-[30rem] w-[60rem] -translate-x-1/2 rounded-full bg-nest-600/40 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="font-display text-4xl font-semibold text-balance sm:text-5xl">Ready to turn “did you do your chores?” into “look what I did!”</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">Create your nest, add your kids, and hand them the tablet.</p>
          <Button asChild size="lg" className="mt-8 h-12 bg-sun-500 px-6 text-base text-nest-950 hover:bg-sun-400">
            <Link href="/signup">
              Get started free
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-white/50 sm:flex-row">
          <Logo tone="light" size="sm" />
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/login" className="hover:text-white">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-white">
              Create account
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
          </div>
          <div>© {new Date().getFullYear()} QuestNest</div>
        </div>
      </footer>
    </div>
  );
}
