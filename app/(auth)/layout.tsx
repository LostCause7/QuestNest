import Link from "next/link";
import { Logo, LogoMark } from "@/components/brand/logo";

const perks = [
  { emoji: "🗺️", text: "Chores become quests kids want to finish" },
  { emoji: "⭐", text: "A custom currency your family names" },
  { emoji: "🛍️", text: "A reward shop you fully control" },
  { emoji: "🔥", text: "Streaks, levels and badges that keep them going" },
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[linear-gradient(160deg,oklch(0.4_0.05_230),oklch(0.28_0.04_230))] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -top-24 -left-24 size-96 rounded-full bg-sky-200/20 blur-3xl" />
        <div className="absolute -right-32 bottom-0 size-[28rem] rounded-full bg-white/10 blur-3xl" />
        <Link href="/" className="relative z-10 w-fit">
          <Logo tone="light" size="md" />
        </Link>
        <div className="relative z-10 max-w-md space-y-8">
          <div className="space-y-3">
            <h1 className="font-display text-4xl font-semibold leading-tight text-balance">
              The family HQ where chores turn into quests.
            </h1>
            <p className="text-white/80">
              Set it up once, then watch your kids race to check things off. You approve, they earn, everyone wins.
            </p>
          </div>
          <ul className="space-y-3">
            {perks.map((p) => (
              <li key={p.text} className="flex items-center gap-3 text-white/90">
                <span className="qn-glass flex size-9 items-center justify-center rounded-xl text-lg text-slate-900">
                  {p.emoji}
                </span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative z-10 flex items-center gap-3 text-sm text-white/70">
          <LogoMark className="size-5" tone="light" />
          Free for families. No app download — works on any device.
        </div>
      </aside>

      <main className="flex flex-col bg-background">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link href="/">
            <Logo size="sm" />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
